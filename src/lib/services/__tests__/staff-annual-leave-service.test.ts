import { describe, it, expect } from "vitest";
import { _testing, type StaffAnnualLeaveRow } from "../staff-annual-leave-service";

const { computeStaffAnnualLeaveMetrics, computeStaffAnnualLeaveAlerts, generateStaffAnnualLeaveCaraInsights } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(overrides?: Partial<StaffAnnualLeaveRow>): StaffAnnualLeaveRow {
  return {
    id: overrides?.id ?? "r-1",
    home_id: overrides?.home_id ?? "home-1",
    staff_name: overrides?.staff_name ?? "Alice Walker",
    staff_id: "staff_id" in (overrides ?? {}) ? (overrides!.staff_id ?? null) : null,
    start_date: overrides?.start_date ?? "2026-06-01",
    end_date: overrides?.end_date ?? "2026-06-05",
    leave_type: overrides?.leave_type ?? "annual_leave",
    approval_status: overrides?.approval_status ?? "approved",
    cover_arrangement: overrides?.cover_arrangement ?? "internal_swap",
    staffing_impact: overrides?.staffing_impact ?? "no_impact",
    days_requested: overrides?.days_requested ?? 5,
    approved_by: "approved_by" in (overrides ?? {}) ? (overrides!.approved_by ?? null) : null,
    cover_confirmed: overrides?.cover_confirmed ?? true,
    handover_completed: overrides?.handover_completed ?? true,
    children_informed: overrides?.children_informed ?? true,
    minimum_staffing_maintained: overrides?.minimum_staffing_maintained ?? true,
    entitlement_remaining: "entitlement_remaining" in (overrides ?? {}) ? (overrides!.entitlement_remaining ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(),
    updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("staff-annual-leave-service", () => {
  // ═══════════════════════════════════════════════════════════════════════
  // computeStaffAnnualLeaveMetrics
  // ═══════════════════════════════════════════════════════════════════════

  describe("computeStaffAnnualLeaveMetrics", () => {
    it("returns zeros for empty", () => {
      const m = computeStaffAnnualLeaveMetrics([]);
      expect(m.total_requests).toBe(0);
      expect(m.declined_count).toBe(0);
      expect(m.pending_count).toBe(0);
      expect(m.critical_understaffing_count).toBe(0);
      expect(m.no_cover_count).toBe(0);
      expect(m.cover_confirmed_rate).toBe(0);
      expect(m.handover_completed_rate).toBe(0);
      expect(m.children_informed_rate).toBe(0);
      expect(m.minimum_staffing_rate).toBe(0);
      expect(m.approved_rate).toBe(0);
      expect(m.unique_staff).toBe(0);
    });

    it("returns empty breakdowns for empty", () => {
      const m = computeStaffAnnualLeaveMetrics([]);
      expect(m.leave_type_breakdown).toEqual({});
      expect(m.impact_breakdown).toEqual({});
    });

    it("total_requests counts rows", () => {
      expect(computeStaffAnnualLeaveMetrics([makeRow(), makeRow(), makeRow()]).total_requests).toBe(3);
    });

    it("counts declined requests", () => {
      expect(computeStaffAnnualLeaveMetrics([makeRow({ approval_status: "declined" })]).declined_count).toBe(1);
    });

    it("does not count approved as declined", () => {
      expect(computeStaffAnnualLeaveMetrics([makeRow({ approval_status: "approved" })]).declined_count).toBe(0);
    });

    it("counts pending requests (requested + pending_cover)", () => {
      const m = computeStaffAnnualLeaveMetrics([
        makeRow({ approval_status: "requested" }),
        makeRow({ approval_status: "pending_cover" }),
        makeRow({ approval_status: "approved" }),
      ]);
      expect(m.pending_count).toBe(2);
    });

    it("does not count approved as pending", () => {
      expect(computeStaffAnnualLeaveMetrics([makeRow({ approval_status: "approved" })]).pending_count).toBe(0);
    });

    it("counts critical_understaffing_count", () => {
      expect(computeStaffAnnualLeaveMetrics([makeRow({ staffing_impact: "critical_understaffing" })]).critical_understaffing_count).toBe(1);
    });

    it("does not count moderate as critical", () => {
      expect(computeStaffAnnualLeaveMetrics([makeRow({ staffing_impact: "moderate_impact" })]).critical_understaffing_count).toBe(0);
    });

    it("counts no_cover_count when cover_confirmed is false", () => {
      expect(computeStaffAnnualLeaveMetrics([makeRow({ cover_confirmed: false })]).no_cover_count).toBe(1);
    });

    it("no_cover_count is 0 when all confirmed", () => {
      expect(computeStaffAnnualLeaveMetrics([makeRow({ cover_confirmed: true })]).no_cover_count).toBe(0);
    });

    // ── Boolean rates ──
    it("cover_confirmed_rate 100 when all true", () => {
      expect(computeStaffAnnualLeaveMetrics([makeRow({ cover_confirmed: true })]).cover_confirmed_rate).toBe(100);
    });

    it("cover_confirmed_rate 0 when all false", () => {
      expect(computeStaffAnnualLeaveMetrics([makeRow({ cover_confirmed: false })]).cover_confirmed_rate).toBe(0);
    });

    it("cover_confirmed_rate 50 when half", () => {
      const m = computeStaffAnnualLeaveMetrics([makeRow({ cover_confirmed: true }), makeRow({ cover_confirmed: false })]);
      expect(m.cover_confirmed_rate).toBe(50);
    });

    it("cover_confirmed_rate rounds to one decimal (66.7)", () => {
      const m = computeStaffAnnualLeaveMetrics([makeRow({ cover_confirmed: true }), makeRow({ cover_confirmed: true }), makeRow({ cover_confirmed: false })]);
      expect(m.cover_confirmed_rate).toBe(66.7);
    });

    it("cover_confirmed_rate rounds to one decimal (33.3)", () => {
      const m = computeStaffAnnualLeaveMetrics([makeRow({ cover_confirmed: true }), makeRow({ cover_confirmed: false }), makeRow({ cover_confirmed: false })]);
      expect(m.cover_confirmed_rate).toBe(33.3);
    });

    it("handover_completed_rate 100 when all true", () => {
      expect(computeStaffAnnualLeaveMetrics([makeRow({ handover_completed: true })]).handover_completed_rate).toBe(100);
    });

    it("handover_completed_rate 0 when all false", () => {
      expect(computeStaffAnnualLeaveMetrics([makeRow({ handover_completed: false })]).handover_completed_rate).toBe(0);
    });

    it("children_informed_rate 100 when all true", () => {
      expect(computeStaffAnnualLeaveMetrics([makeRow({ children_informed: true })]).children_informed_rate).toBe(100);
    });

    it("children_informed_rate 0 when all false", () => {
      expect(computeStaffAnnualLeaveMetrics([makeRow({ children_informed: false })]).children_informed_rate).toBe(0);
    });

    it("minimum_staffing_rate 100 when all true", () => {
      expect(computeStaffAnnualLeaveMetrics([makeRow({ minimum_staffing_maintained: true })]).minimum_staffing_rate).toBe(100);
    });

    it("minimum_staffing_rate 0 when all false", () => {
      expect(computeStaffAnnualLeaveMetrics([makeRow({ minimum_staffing_maintained: false })]).minimum_staffing_rate).toBe(0);
    });

    // ── Approved rate (excluding cancelled) ──
    it("approved_rate 100 when all non-cancelled are approved", () => {
      expect(computeStaffAnnualLeaveMetrics([makeRow({ approval_status: "approved" })]).approved_rate).toBe(100);
    });

    it("approved_rate 0 when none approved", () => {
      expect(computeStaffAnnualLeaveMetrics([makeRow({ approval_status: "declined" })]).approved_rate).toBe(0);
    });

    it("approved_rate excludes cancelled from denominator", () => {
      const m = computeStaffAnnualLeaveMetrics([
        makeRow({ approval_status: "approved" }),
        makeRow({ approval_status: "cancelled" }),
      ]);
      // 1 approved out of 1 non-cancelled = 100%
      expect(m.approved_rate).toBe(100);
    });

    it("approved_rate 50 when half non-cancelled are approved", () => {
      const m = computeStaffAnnualLeaveMetrics([
        makeRow({ approval_status: "approved" }),
        makeRow({ approval_status: "declined" }),
      ]);
      expect(m.approved_rate).toBe(50);
    });

    it("approved_rate 0 when all are cancelled", () => {
      const m = computeStaffAnnualLeaveMetrics([
        makeRow({ approval_status: "cancelled" }),
        makeRow({ approval_status: "cancelled" }),
      ]);
      expect(m.approved_rate).toBe(0);
    });

    // ── Breakdowns ──
    it("leave_type_breakdown counts all types", () => {
      const types = ["annual_leave", "bank_holiday", "compassionate", "toil"] as const;
      const rows = types.map((t) => makeRow({ leave_type: t }));
      const m = computeStaffAnnualLeaveMetrics(rows);
      for (const t of types) expect(m.leave_type_breakdown[t]).toBe(1);
    });

    it("leave_type_breakdown accumulates duplicates", () => {
      const m = computeStaffAnnualLeaveMetrics([makeRow({ leave_type: "annual_leave" }), makeRow({ leave_type: "annual_leave" })]);
      expect(m.leave_type_breakdown["annual_leave"]).toBe(2);
    });

    it("impact_breakdown counts all impacts", () => {
      const impacts = ["no_impact", "minor_impact", "moderate_impact", "significant_impact", "critical_understaffing"] as const;
      const rows = impacts.map((i) => makeRow({ staffing_impact: i }));
      const m = computeStaffAnnualLeaveMetrics(rows);
      for (const i of impacts) expect(m.impact_breakdown[i]).toBe(1);
    });

    it("impact_breakdown accumulates duplicates", () => {
      const m = computeStaffAnnualLeaveMetrics([makeRow({ staffing_impact: "no_impact" }), makeRow({ staffing_impact: "no_impact" })]);
      expect(m.impact_breakdown["no_impact"]).toBe(2);
    });

    // ── Unique staff ──
    it("unique_staff distinct", () => {
      const m = computeStaffAnnualLeaveMetrics([makeRow({ staff_name: "A" }), makeRow({ staff_name: "B" }), makeRow({ staff_name: "A" })]);
      expect(m.unique_staff).toBe(2);
    });

    it("unique_staff single", () => {
      expect(computeStaffAnnualLeaveMetrics([makeRow()]).unique_staff).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // computeStaffAnnualLeaveAlerts
  // ═══════════════════════════════════════════════════════════════════════

  describe("computeStaffAnnualLeaveAlerts", () => {
    it("returns empty for empty", () => {
      expect(computeStaffAnnualLeaveAlerts([])).toEqual([]);
    });

    it("returns empty for clean rows", () => {
      expect(computeStaffAnnualLeaveAlerts([makeRow()])).toEqual([]);
    });

    // -- critical_understaffing_approved --
    it("fires critical_understaffing_approved when approved + critical_understaffing + minimum staffing not maintained", () => {
      const a = computeStaffAnnualLeaveAlerts([makeRow({
        approval_status: "approved",
        staffing_impact: "critical_understaffing",
        minimum_staffing_maintained: false,
        staff_name: "Jo",
        start_date: "2026-06-01",
        end_date: "2026-06-05",
      })]);
      const f = a.find((x) => x.type === "critical_understaffing_approved");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("critical");
      expect(f!.message).toContain("Jo");
      expect(f!.message).toContain("2026-06-01");
      expect(f!.message).toContain("2026-06-05");
      expect(f!.record_id).toBe("r-1");
    });

    it("no critical_understaffing_approved if minimum staffing maintained", () => {
      expect(computeStaffAnnualLeaveAlerts([makeRow({
        approval_status: "approved",
        staffing_impact: "critical_understaffing",
        minimum_staffing_maintained: true,
      })]).find((x) => x.type === "critical_understaffing_approved")).toBeUndefined();
    });

    it("no critical_understaffing_approved if not approved", () => {
      expect(computeStaffAnnualLeaveAlerts([makeRow({
        approval_status: "requested",
        staffing_impact: "critical_understaffing",
        minimum_staffing_maintained: false,
      })]).find((x) => x.type === "critical_understaffing_approved")).toBeUndefined();
    });

    it("no critical_understaffing_approved if not critical impact", () => {
      expect(computeStaffAnnualLeaveAlerts([makeRow({
        approval_status: "approved",
        staffing_impact: "moderate_impact",
        minimum_staffing_maintained: false,
      })]).find((x) => x.type === "critical_understaffing_approved")).toBeUndefined();
    });

    // -- approved_no_cover --
    it("fires approved_no_cover when approved + no cover confirmed", () => {
      const a = computeStaffAnnualLeaveAlerts([makeRow({
        approval_status: "approved",
        cover_confirmed: false,
        staff_name: "Bob",
        start_date: "2026-07-01",
        end_date: "2026-07-03",
      })]);
      const f = a.find((x) => x.type === "approved_no_cover");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("Bob");
      expect(f!.record_id).toBe("r-1");
    });

    it("no approved_no_cover if cover is confirmed", () => {
      expect(computeStaffAnnualLeaveAlerts([makeRow({
        approval_status: "approved",
        cover_confirmed: true,
      })]).find((x) => x.type === "approved_no_cover")).toBeUndefined();
    });

    it("no approved_no_cover if not approved", () => {
      expect(computeStaffAnnualLeaveAlerts([makeRow({
        approval_status: "requested",
        cover_confirmed: false,
      })]).find((x) => x.type === "approved_no_cover")).toBeUndefined();
    });

    // -- overlapping_leave --
    it("fires overlapping_leave for two overlapping approved periods", () => {
      const a = computeStaffAnnualLeaveAlerts([
        makeRow({ id: "r-1", approval_status: "approved", staff_name: "A", start_date: "2026-06-01", end_date: "2026-06-05" }),
        makeRow({ id: "r-2", approval_status: "approved", staff_name: "B", start_date: "2026-06-03", end_date: "2026-06-07" }),
      ]);
      const f = a.find((x) => x.type === "overlapping_leave");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("A");
      expect(f!.message).toContain("B");
    });

    it("no overlapping_leave for non-overlapping periods", () => {
      const a = computeStaffAnnualLeaveAlerts([
        makeRow({ id: "r-1", approval_status: "approved", staff_name: "A", start_date: "2026-06-01", end_date: "2026-06-03" }),
        makeRow({ id: "r-2", approval_status: "approved", staff_name: "B", start_date: "2026-06-04", end_date: "2026-06-07" }),
      ]);
      expect(a.find((x) => x.type === "overlapping_leave")).toBeUndefined();
    });

    it("no overlapping_leave for non-approved leave", () => {
      const a = computeStaffAnnualLeaveAlerts([
        makeRow({ id: "r-1", approval_status: "requested", start_date: "2026-06-01", end_date: "2026-06-05" }),
        makeRow({ id: "r-2", approval_status: "requested", start_date: "2026-06-03", end_date: "2026-06-07" }),
      ]);
      expect(a.find((x) => x.type === "overlapping_leave")).toBeUndefined();
    });

    it("fires overlapping_leave for exact same dates", () => {
      const a = computeStaffAnnualLeaveAlerts([
        makeRow({ id: "r-1", approval_status: "approved", staff_name: "X", start_date: "2026-06-01", end_date: "2026-06-05" }),
        makeRow({ id: "r-2", approval_status: "approved", staff_name: "Y", start_date: "2026-06-01", end_date: "2026-06-05" }),
      ]);
      expect(a.find((x) => x.type === "overlapping_leave")).toBeDefined();
    });

    // -- handover_not_completed --
    it("fires handover_not_completed when approved + no handover", () => {
      const a = computeStaffAnnualLeaveAlerts([makeRow({
        approval_status: "approved",
        handover_completed: false,
        staff_name: "Carol",
      })]);
      const f = a.find((x) => x.type === "handover_not_completed");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("medium");
      expect(f!.message).toContain("Carol");
      expect(f!.record_id).toBe("r-1");
    });

    it("no handover_not_completed if handover done", () => {
      expect(computeStaffAnnualLeaveAlerts([makeRow({
        approval_status: "approved",
        handover_completed: true,
      })]).find((x) => x.type === "handover_not_completed")).toBeUndefined();
    });

    it("no handover_not_completed if not approved", () => {
      expect(computeStaffAnnualLeaveAlerts([makeRow({
        approval_status: "declined",
        handover_completed: false,
      })]).find((x) => x.type === "handover_not_completed")).toBeUndefined();
    });

    // -- combined alerts --
    it("fires all applicable alerts", () => {
      const a = computeStaffAnnualLeaveAlerts([
        makeRow({
          id: "r-1",
          approval_status: "approved",
          staffing_impact: "critical_understaffing",
          minimum_staffing_maintained: false,
          cover_confirmed: false,
          handover_completed: false,
          staff_name: "A",
          start_date: "2026-06-01",
          end_date: "2026-06-05",
        }),
        makeRow({
          id: "r-2",
          approval_status: "approved",
          cover_confirmed: false,
          handover_completed: false,
          staff_name: "B",
          start_date: "2026-06-03",
          end_date: "2026-06-07",
        }),
      ]);
      const types = a.map((x) => x.type);
      expect(types).toContain("critical_understaffing_approved");
      expect(types).toContain("approved_no_cover");
      expect(types).toContain("overlapping_leave");
      expect(types).toContain("handover_not_completed");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // generateStaffAnnualLeaveCaraInsights
  // ═══════════════════════════════════════════════════════════════════════

  describe("generateStaffAnnualLeaveCaraInsights", () => {
    it("returns 3 insights for empty data", () => {
      const m = computeStaffAnnualLeaveMetrics([]);
      const a = computeStaffAnnualLeaveAlerts([]);
      const insights = generateStaffAnnualLeaveCaraInsights(m, a);
      expect(insights).toHaveLength(3);
    });

    it("insight 1 starts with [pink]", () => {
      const m = computeStaffAnnualLeaveMetrics([]);
      const a = computeStaffAnnualLeaveAlerts([]);
      expect(generateStaffAnnualLeaveCaraInsights(m, a)[0]).toMatch(/^\[pink\]/);
    });

    it("insight 2 starts with [amber]", () => {
      const m = computeStaffAnnualLeaveMetrics([]);
      const a = computeStaffAnnualLeaveAlerts([]);
      expect(generateStaffAnnualLeaveCaraInsights(m, a)[1]).toMatch(/^\[amber\]/);
    });

    it("insight 3 starts with [reflect]", () => {
      const m = computeStaffAnnualLeaveMetrics([]);
      const a = computeStaffAnnualLeaveAlerts([]);
      expect(generateStaffAnnualLeaveCaraInsights(m, a)[2]).toMatch(/^\[reflect\]/);
    });

    it("insight 1 contains total request count", () => {
      const m = computeStaffAnnualLeaveMetrics([makeRow(), makeRow()]);
      const a = computeStaffAnnualLeaveAlerts([makeRow(), makeRow()]);
      expect(generateStaffAnnualLeaveCaraInsights(m, a)[0]).toContain("2 leave requests");
    });

    it("insight 1 contains unique staff count", () => {
      const m = computeStaffAnnualLeaveMetrics([makeRow({ staff_name: "A" }), makeRow({ staff_name: "B" })]);
      const a = computeStaffAnnualLeaveAlerts([]);
      expect(generateStaffAnnualLeaveCaraInsights(m, a)[0]).toContain("2 staff members");
    });

    it("insight 1 uses singular staff member for 1", () => {
      const m = computeStaffAnnualLeaveMetrics([makeRow()]);
      const a = computeStaffAnnualLeaveAlerts([]);
      expect(generateStaffAnnualLeaveCaraInsights(m, a)[0]).toContain("1 staff member");
    });

    it("insight 1 contains approved rate", () => {
      const m = computeStaffAnnualLeaveMetrics([makeRow({ approval_status: "approved" })]);
      const a = computeStaffAnnualLeaveAlerts([]);
      expect(generateStaffAnnualLeaveCaraInsights(m, a)[0]).toContain("Approved rate: 100%");
    });

    it("insight 1 contains cover confirmed rate", () => {
      const m = computeStaffAnnualLeaveMetrics([makeRow({ cover_confirmed: true })]);
      const a = computeStaffAnnualLeaveAlerts([]);
      expect(generateStaffAnnualLeaveCaraInsights(m, a)[0]).toContain("Cover confirmed rate: 100%");
    });

    it("insight 1 contains minimum staffing maintained rate", () => {
      const m = computeStaffAnnualLeaveMetrics([makeRow({ minimum_staffing_maintained: true })]);
      const a = computeStaffAnnualLeaveAlerts([]);
      expect(generateStaffAnnualLeaveCaraInsights(m, a)[0]).toContain("Minimum staffing maintained rate: 100%");
    });

    it("insight 2 mentions critical and high alert counts when present", () => {
      const rows = [
        makeRow({
          id: "r-1",
          approval_status: "approved",
          staffing_impact: "critical_understaffing",
          minimum_staffing_maintained: false,
          cover_confirmed: false,
          handover_completed: false,
          start_date: "2026-06-01",
          end_date: "2026-06-05",
        }),
      ];
      const m = computeStaffAnnualLeaveMetrics(rows);
      const a = computeStaffAnnualLeaveAlerts(rows);
      const i = generateStaffAnnualLeaveCaraInsights(m, a)[1];
      expect(i).toContain("1 critical");
      expect(i).toContain("high-priority");
    });

    it("insight 2 shows no concerns when none", () => {
      const m = computeStaffAnnualLeaveMetrics([makeRow()]);
      const a = computeStaffAnnualLeaveAlerts([makeRow()]);
      expect(generateStaffAnnualLeaveCaraInsights(m, a)[1]).toContain("No critical or high-priority concerns");
    });

    it("insight 2 contains handover completed rate", () => {
      const m = computeStaffAnnualLeaveMetrics([makeRow()]);
      const a = computeStaffAnnualLeaveAlerts([]);
      expect(generateStaffAnnualLeaveCaraInsights(m, a)[1]).toContain("Handover completed rate");
    });

    it("insight 2 contains children informed rate", () => {
      const m = computeStaffAnnualLeaveMetrics([makeRow()]);
      const a = computeStaffAnnualLeaveAlerts([]);
      expect(generateStaffAnnualLeaveCaraInsights(m, a)[1]).toContain("Children informed rate");
    });

    it("insight 2 contains critical understaffing count", () => {
      const m = computeStaffAnnualLeaveMetrics([makeRow()]);
      const a = computeStaffAnnualLeaveAlerts([]);
      expect(generateStaffAnnualLeaveCaraInsights(m, a)[1]).toContain("Critical understaffing count");
    });

    it("insight 3 contains reflective question about children", () => {
      const m = computeStaffAnnualLeaveMetrics([]);
      const a = computeStaffAnnualLeaveAlerts([]);
      const i = generateStaffAnnualLeaveCaraInsights(m, a)[2];
      expect(i).toContain("continuity of care");
      expect(i).toContain("children");
    });
  });
});
