import { describe, it, expect } from "vitest";
import {
  computeEmergencyMetrics,
  identifyEmergencyAlerts,
  type EmergencyPlacement,
} from "./emergency-placement-service";

function makePlacement(overrides: Partial<EmergencyPlacement> = {}): EmergencyPlacement {
  return {
    id: "ep-1",
    home_id: "home-1",
    child_name: "Child A",
    child_id: "child-1",
    referral_date: "2026-05-01",
    referral_time: "14:30",
    emergency_reason: "placement_breakdown",
    referring_authority: "LA Central",
    social_worker_name: "SW Smith",
    placement_decision: "admitted",
    decision_made_by: "Manager",
    decision_date: "2026-05-01",
    admission_date: "2026-05-01",
    risk_assessment_status: "completed_pre_admission",
    existing_children_consulted: true,
    impact_assessment_completed: true,
    out_of_hours: false,
    emergency_staffing_arranged: true,
    essential_info_received: true,
    care_plan_received: true,
    post_admission_review: "completed_72h",
    emergency_status: "active",
    child_views: "Child feels safe",
    existing_children_views: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

describe("emergency-placement-service", () => {
  // ── computeEmergencyMetrics ───────────────────────────────────────

  describe("computeEmergencyMetrics", () => {
    it("returns zeroes for empty data", () => {
      const m = computeEmergencyMetrics([]);
      expect(m.total_referrals).toBe(0);
      expect(m.admitted_count).toBe(0);
      expect(m.declined_count).toBe(0);
      expect(m.pending_count).toBe(0);
      expect(m.admission_rate).toBeNull(); // fab-0.
      expect(m.out_of_hours_count).toBe(0);
    });

    it("counts decisions correctly", () => {
      const placements = [
        makePlacement({ id: "1", placement_decision: "admitted" }),
        makePlacement({ id: "2", placement_decision: "declined_capacity" }),
        makePlacement({ id: "3", placement_decision: "declined_risk" }),
        makePlacement({ id: "4", placement_decision: "pending" }),
      ];
      const m = computeEmergencyMetrics(placements);
      expect(m.total_referrals).toBe(4);
      expect(m.admitted_count).toBe(1);
      expect(m.declined_count).toBe(2);
      expect(m.pending_count).toBe(1);
      expect(m.admission_rate).toBe(25);
    });

    it("computes out_of_hours rate correctly", () => {
      const placements = [
        makePlacement({ id: "1", out_of_hours: true }),
        makePlacement({ id: "2", out_of_hours: false }),
      ];
      const m = computeEmergencyMetrics(placements);
      expect(m.out_of_hours_count).toBe(1);
      expect(m.out_of_hours_rate).toBe(50);
    });

    it("computes admitted-only rates (existing_children_consulted, impact_assessed, etc.)", () => {
      const placements = [
        makePlacement({
          id: "1",
          placement_decision: "admitted",
          existing_children_consulted: true,
          impact_assessment_completed: true,
          essential_info_received: true,
          care_plan_received: false,
        }),
        makePlacement({
          id: "2",
          placement_decision: "admitted",
          existing_children_consulted: false,
          impact_assessment_completed: false,
          essential_info_received: false,
          care_plan_received: false,
        }),
        makePlacement({
          id: "3",
          placement_decision: "declined_capacity",
          existing_children_consulted: false,
          impact_assessment_completed: false,
          essential_info_received: false,
          care_plan_received: false,
        }),
      ];
      const m = computeEmergencyMetrics(placements);
      // Only 2 admitted placements
      expect(m.existing_children_consulted_rate).toBe(50);
      expect(m.impact_assessed_rate).toBe(50);
      expect(m.essential_info_rate).toBe(50);
      // 2 admitted, 0 care_plan_received → real 0.
      expect(m.care_plan_rate).toBe(0);
    });

    it("computes child_views_rate across all placements", () => {
      const placements = [
        makePlacement({ id: "1", child_views: "Views here" }),
        makePlacement({ id: "2", child_views: null }),
      ];
      const m = computeEmergencyMetrics(placements);
      expect(m.child_views_rate).toBe(50);
    });
  });

  // ── identifyEmergencyAlerts ───────────────────────────────────────

  describe("identifyEmergencyAlerts", () => {
    it("returns empty alerts for empty data", () => {
      expect(identifyEmergencyAlerts([])).toHaveLength(0);
    });

    it("fires risk_not_completed (critical) for admitted with no risk assessment", () => {
      const p = makePlacement({
        id: "r-1",
        placement_decision: "admitted",
        risk_assessment_status: "not_completed",
      });
      const alerts = identifyEmergencyAlerts([p]);
      const found = alerts.filter((a) => a.type === "risk_not_completed");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("critical");
    });

    it("fires review_overdue (high) for overdue post-admission review", () => {
      const p = makePlacement({
        id: "ro-1",
        post_admission_review: "overdue",
      });
      const alerts = identifyEmergencyAlerts([p]);
      const found = alerts.filter((a) => a.type === "review_overdue");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("high");
    });

    it("fires children_not_consulted (high) for admitted without consultation", () => {
      const p = makePlacement({
        id: "cn-1",
        placement_decision: "admitted",
        existing_children_consulted: false,
      });
      const alerts = identifyEmergencyAlerts([p]);
      const found = alerts.filter((a) => a.type === "children_not_consulted");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("high");
    });

    it("fires no_essential_info (high) for admitted without essential info", () => {
      const p = makePlacement({
        id: "ne-1",
        placement_decision: "admitted",
        essential_info_received: false,
      });
      const alerts = identifyEmergencyAlerts([p]);
      const found = alerts.filter((a) => a.type === "no_essential_info");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("high");
    });

    it("fires decision_pending (medium) for pending decisions", () => {
      const p = makePlacement({
        id: "dp-1",
        placement_decision: "pending",
      });
      const alerts = identifyEmergencyAlerts([p]);
      const found = alerts.filter((a) => a.type === "decision_pending");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("medium");
    });

    it("does not fire risk_not_completed for non-admitted placements", () => {
      const p = makePlacement({
        id: "nra-1",
        placement_decision: "declined_capacity",
        risk_assessment_status: "not_completed",
      });
      const alerts = identifyEmergencyAlerts([p]);
      const found = alerts.filter((a) => a.type === "risk_not_completed");
      expect(found).toHaveLength(0);
    });
  });
});
