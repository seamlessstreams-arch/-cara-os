import { describe, it, expect } from "vitest";
import {
  computeHomePremisesSafety,
  type HomePremisesInput,
  type BuildingInput,
  type BuildingCheckInput,
  type VehicleInput,
  type VehicleCheckInput,
  type MaintenanceInput,
} from "../home-premises-safety-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeBuilding(overrides: Partial<BuildingInput> = {}): BuildingInput {
  return {
    id: "bld_1",
    gas_cert_expiry: "2026-01-01",
    electrical_cert_expiry: "2026-06-01",
    fire_risk_assessment_date: "2025-03-01",
    ...overrides,
  };
}

function makeCheck(overrides: Partial<BuildingCheckInput> = {}): BuildingCheckInput {
  return {
    status: "completed",
    result: "pass",
    has_action_required: false,
    ...overrides,
  };
}

function makeVehicle(overrides: Partial<VehicleInput> = {}): VehicleInput {
  return {
    id: "veh_1",
    mot_expiry: "2026-01-01",
    insurance_expiry: "2026-01-01",
    tax_expiry: "2026-01-01",
    next_service_due: "2025-12-01",
    ...overrides,
  };
}

function makeVehicleCheck(overrides: Partial<VehicleCheckInput> = {}): VehicleCheckInput {
  return {
    overall_result: "pass",
    has_defects: false,
    ...overrides,
  };
}

function makeMaintenance(overrides: Partial<MaintenanceInput> = {}): MaintenanceInput {
  return {
    priority: "medium",
    status: "completed",
    due_date: "2025-06-01",
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomePremisesInput> = {}): HomePremisesInput {
  return {
    today: "2025-06-15",
    buildings: [],
    building_checks: [],
    vehicles: [],
    vehicle_checks: [],
    maintenance: [],
    ...overrides,
  };
}

// ═════════════════════════════════════════════════════════════════════════════

describe("computeHomePremisesSafety", () => {
  // ── Insufficient Data ──────────────────────────────────────────────

  describe("insufficient data", () => {
    it("returns insufficient_data with no data at all", () => {
      const r = computeHomePremisesSafety(baseInput());
      expect(r.premises_rating).toBe("insufficient_data");
      expect(r.premises_score).toBe(0);
      expect(r.concerns.length).toBeGreaterThan(0);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("does NOT return insufficient_data with only buildings", () => {
      const r = computeHomePremisesSafety(baseInput({
        buildings: [makeBuilding()],
      }));
      expect(r.premises_rating).not.toBe("insufficient_data");
    });

    it("does NOT return insufficient_data with only maintenance", () => {
      const r = computeHomePremisesSafety(baseInput({
        maintenance: [makeMaintenance()],
      }));
      expect(r.premises_rating).not.toBe("insufficient_data");
    });

    it("does NOT return insufficient_data with only vehicles", () => {
      const r = computeHomePremisesSafety(baseInput({
        vehicles: [makeVehicle()],
      }));
      expect(r.premises_rating).not.toBe("insufficient_data");
    });
  });

  // ── Rating Boundaries ─────────────────────────────────────────────

  describe("rating boundaries", () => {
    it("returns outstanding when all metrics excellent", () => {
      // All certs current, all checks pass, all vehicles compliant, no overdue maintenance
      // Score: 52 + 5(certs) + 4(noOverdueChecks) + 3(passRate) + 4(vehicles) + 3(vChecks) + 3(noOverdueMaint) + 3(noUrgent) + 3(completion) = 80
      const r = computeHomePremisesSafety(baseInput({
        buildings: [makeBuilding()],
        building_checks: [
          makeCheck(),
          makeCheck(),
          makeCheck(),
        ],
        vehicles: [makeVehicle()],
        vehicle_checks: [makeVehicleCheck()],
        maintenance: [
          makeMaintenance({ status: "completed", due_date: "2025-06-01" }),
          makeMaintenance({ status: "completed", due_date: "2025-06-10" }),
        ],
      }));
      expect(r.premises_rating).toBe("outstanding");
      expect(r.premises_score).toBe(80);
    });

    it("returns good with minor issues", () => {
      // 1 overdue check, 1 advisory vehicle, 1 urgent open
      const r = computeHomePremisesSafety(baseInput({
        buildings: [makeBuilding()],
        building_checks: [
          makeCheck(),
          makeCheck(),
          makeCheck({ status: "overdue", result: "" }),
        ],
        vehicles: [makeVehicle()],
        vehicle_checks: [makeVehicleCheck({ overall_result: "advisory" })],
        maintenance: [
          makeMaintenance({ status: "completed", due_date: "2025-06-01" }),
          makeMaintenance({ priority: "urgent", status: "open", due_date: "2025-06-20" }),
        ],
      }));
      expect(r.premises_rating).toBe("good");
      expect(r.premises_score).toBeGreaterThanOrEqual(65);
      expect(r.premises_score).toBeLessThan(80);
    });

    it("returns adequate with multiple issues", () => {
      // 1 expired cert, 2 overdue checks, 1 vehicle expired, overdue maintenance
      const r = computeHomePremisesSafety(baseInput({
        buildings: [makeBuilding({ gas_cert_expiry: "2025-01-01" })],
        building_checks: [
          makeCheck(),
          makeCheck({ status: "overdue", result: "" }),
          makeCheck({ status: "overdue", result: "" }),
        ],
        vehicles: [makeVehicle({ mot_expiry: "2025-01-01" })],
        vehicle_checks: [makeVehicleCheck({ overall_result: "fail", has_defects: true })],
        maintenance: [
          makeMaintenance({ status: "open", due_date: "2025-05-01" }),
          makeMaintenance({ status: "completed", due_date: "2025-06-01" }),
        ],
      }));
      expect(r.premises_rating).toBe("adequate");
      expect(r.premises_score).toBeGreaterThanOrEqual(45);
      expect(r.premises_score).toBeLessThan(65);
    });

    it("returns inadequate with severe failures", () => {
      // Multiple expired certs, vehicle failures, overdue maintenance
      const r = computeHomePremisesSafety(baseInput({
        buildings: [makeBuilding({
          gas_cert_expiry: "2024-01-01",
          electrical_cert_expiry: "2024-06-01",
          fire_risk_assessment_date: "2023-01-01",
        })],
        building_checks: [
          makeCheck({ result: "fail" }),
          makeCheck({ status: "overdue", result: "" }),
          makeCheck({ status: "overdue", result: "" }),
        ],
        vehicles: [makeVehicle({ mot_expiry: "2024-01-01", insurance_expiry: "2024-06-01" })],
        vehicle_checks: [makeVehicleCheck({ overall_result: "fail", has_defects: true })],
        maintenance: [
          makeMaintenance({ priority: "urgent", status: "open", due_date: "2025-04-01" }),
          makeMaintenance({ priority: "urgent", status: "open", due_date: "2025-05-01" }),
          makeMaintenance({ status: "open", due_date: "2025-03-01" }),
        ],
      }));
      expect(r.premises_rating).toBe("inadequate");
      expect(r.premises_score).toBeLessThan(45);
    });
  });

  // ── Certifications ────────────────────────────────────────────────

  describe("certifications", () => {
    it("detects gas cert as current when expiry >= today", () => {
      const r = computeHomePremisesSafety(baseInput({
        buildings: [makeBuilding({ gas_cert_expiry: "2025-06-15" })],
      }));
      expect(r.certification_profile.gas_current).toBe(true);
    });

    it("detects gas cert as expired when expiry < today", () => {
      const r = computeHomePremisesSafety(baseInput({
        buildings: [makeBuilding({ gas_cert_expiry: "2025-06-14" })],
      }));
      expect(r.certification_profile.gas_current).toBe(false);
    });

    it("detects fire risk as overdue when assessment > 12 months ago", () => {
      const r = computeHomePremisesSafety(baseInput({
        buildings: [makeBuilding({ fire_risk_assessment_date: "2024-01-01" })],
      }));
      expect(r.certification_profile.fire_risk_current).toBe(false);
    });

    it("detects fire risk as current when assessment within 12 months", () => {
      const r = computeHomePremisesSafety(baseInput({
        buildings: [makeBuilding({ fire_risk_assessment_date: "2025-01-01" })],
      }));
      expect(r.certification_profile.fire_risk_current).toBe(true);
    });

    it("counts total expired certifications", () => {
      const r = computeHomePremisesSafety(baseInput({
        buildings: [makeBuilding({
          gas_cert_expiry: "2024-01-01",
          electrical_cert_expiry: "2024-06-01",
          fire_risk_assessment_date: "2023-01-01",
        })],
      }));
      expect(r.certification_profile.expired_count).toBe(3);
      expect(r.certification_profile.all_current).toBe(false);
    });
  });

  // ── Building Checks ───────────────────────────────────────────────

  describe("building checks", () => {
    it("counts completed, overdue, and pass rate", () => {
      const r = computeHomePremisesSafety(baseInput({
        building_checks: [
          makeCheck({ status: "completed", result: "pass" }),
          makeCheck({ status: "completed", result: "pass" }),
          makeCheck({ status: "completed", result: "fail" }),
          makeCheck({ status: "overdue", result: "" }),
        ],
      }));
      expect(r.check_profile.total_checks).toBe(4);
      expect(r.check_profile.completed_count).toBe(3);
      expect(r.check_profile.overdue_count).toBe(1);
      expect(r.check_profile.pass_rate).toBe(67);
      expect(r.check_profile.fail_count).toBe(1);
    });

    it("full bonus with 0 overdue checks", () => {
      const r = computeHomePremisesSafety(baseInput({
        building_checks: [makeCheck(), makeCheck()],
      }));
      expect(r.check_profile.overdue_count).toBe(0);
    });

    it("penalty with 2+ overdue checks", () => {
      const r = computeHomePremisesSafety(baseInput({
        building_checks: [
          makeCheck({ status: "overdue", result: "" }),
          makeCheck({ status: "overdue", result: "" }),
        ],
      }));
      expect(r.check_profile.overdue_count).toBe(2);
    });
  });

  // ── Vehicle Compliance ────────────────────────────────────────────

  describe("vehicle compliance", () => {
    it("all compliant when all dates future", () => {
      const r = computeHomePremisesSafety(baseInput({
        vehicles: [makeVehicle()],
      }));
      expect(r.vehicle_profile.all_compliant).toBe(true);
      expect(r.vehicle_profile.expired_count).toBe(0);
    });

    it("detects expired MOT", () => {
      const r = computeHomePremisesSafety(baseInput({
        vehicles: [makeVehicle({ mot_expiry: "2025-05-01" })],
      }));
      expect(r.vehicle_profile.all_compliant).toBe(false);
      expect(r.vehicle_profile.expired_count).toBe(1);
    });

    it("counts multiple expired documents across vehicles", () => {
      const r = computeHomePremisesSafety(baseInput({
        vehicles: [
          makeVehicle({ id: "v1", mot_expiry: "2025-01-01", insurance_expiry: "2025-03-01" }),
          makeVehicle({ id: "v2", tax_expiry: "2025-04-01" }),
        ],
      }));
      expect(r.vehicle_profile.expired_count).toBe(3);
    });

    it("counts vehicle check results", () => {
      const r = computeHomePremisesSafety(baseInput({
        vehicle_checks: [
          makeVehicleCheck({ overall_result: "pass" }),
          makeVehicleCheck({ overall_result: "advisory" }),
          makeVehicleCheck({ overall_result: "fail" }),
        ],
      }));
      expect(r.vehicle_profile.checks_pass_count).toBe(1);
      expect(r.vehicle_profile.checks_advisory_count).toBe(1);
      expect(r.vehicle_profile.checks_fail_count).toBe(1);
    });
  });

  // ── Maintenance ───────────────────────────────────────────────────

  describe("maintenance", () => {
    it("detects overdue items (open with past due date)", () => {
      const r = computeHomePremisesSafety(baseInput({
        maintenance: [
          makeMaintenance({ status: "open", due_date: "2025-05-01" }),
          makeMaintenance({ status: "completed", due_date: "2025-05-01" }),
          makeMaintenance({ status: "open", due_date: "2025-07-01" }),  // future
        ],
      }));
      expect(r.maintenance_profile.overdue_count).toBe(1);
    });

    it("counts urgent open items", () => {
      const r = computeHomePremisesSafety(baseInput({
        maintenance: [
          makeMaintenance({ priority: "urgent", status: "open", due_date: "2025-06-20" }),
          makeMaintenance({ priority: "urgent", status: "open", due_date: "2025-06-25" }),
          makeMaintenance({ priority: "high", status: "open", due_date: "2025-06-20" }),
        ],
      }));
      expect(r.maintenance_profile.urgent_open_count).toBe(2);
    });

    it("computes completion rate from due items", () => {
      const r = computeHomePremisesSafety(baseInput({
        maintenance: [
          makeMaintenance({ status: "completed", due_date: "2025-06-01" }),
          makeMaintenance({ status: "completed", due_date: "2025-06-10" }),
          makeMaintenance({ status: "open", due_date: "2025-06-05" }),
          makeMaintenance({ status: "open", due_date: "2025-07-01" }),  // future — not counted
        ],
      }));
      // 3 items due (<=today), 2 completed → 67%
      expect(r.maintenance_profile.completion_rate).toBe(67);
    });

    it("full bonus with 0 overdue and 0 urgent open", () => {
      const r = computeHomePremisesSafety(baseInput({
        maintenance: [
          makeMaintenance({ status: "completed", due_date: "2025-06-01" }),
          makeMaintenance({ status: "scheduled", due_date: "2025-07-01" }),
        ],
      }));
      expect(r.maintenance_profile.overdue_count).toBe(0);
      expect(r.maintenance_profile.urgent_open_count).toBe(0);
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────

  describe("strengths", () => {
    it("generates certification strength when all current", () => {
      const r = computeHomePremisesSafety(baseInput({
        buildings: [makeBuilding()],
      }));
      expect(r.strengths.some(s => s.includes("certifications current"))).toBe(true);
    });

    it("generates no-overdue-checks strength", () => {
      const r = computeHomePremisesSafety(baseInput({
        building_checks: [makeCheck(), makeCheck()],
      }));
      expect(r.strengths.some(s => s.includes("No overdue premises checks"))).toBe(true);
    });

    it("generates vehicle compliance strength", () => {
      const r = computeHomePremisesSafety(baseInput({
        vehicles: [makeVehicle()],
      }));
      expect(r.strengths.some(s => s.includes("vehicles fully compliant"))).toBe(true);
    });

    it("generates no-overdue-maintenance strength", () => {
      const r = computeHomePremisesSafety(baseInput({
        maintenance: [makeMaintenance({ status: "completed", due_date: "2025-06-01" })],
      }));
      expect(r.strengths.some(s => s.includes("No overdue maintenance"))).toBe(true);
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────

  describe("concerns", () => {
    it("flags expired gas certificate", () => {
      const r = computeHomePremisesSafety(baseInput({
        buildings: [makeBuilding({ gas_cert_expiry: "2025-01-01" })],
      }));
      expect(r.concerns.some(c => c.includes("Gas safety certificate expired"))).toBe(true);
    });

    it("flags expired electrical certificate", () => {
      const r = computeHomePremisesSafety(baseInput({
        buildings: [makeBuilding({ electrical_cert_expiry: "2025-01-01" })],
      }));
      expect(r.concerns.some(c => c.includes("Electrical installation certificate expired"))).toBe(true);
    });

    it("flags overdue fire risk assessment", () => {
      const r = computeHomePremisesSafety(baseInput({
        buildings: [makeBuilding({ fire_risk_assessment_date: "2024-01-01" })],
      }));
      expect(r.concerns.some(c => c.includes("Fire risk assessment"))).toBe(true);
    });

    it("flags overdue checks", () => {
      const r = computeHomePremisesSafety(baseInput({
        building_checks: [makeCheck({ status: "overdue", result: "" })],
      }));
      expect(r.concerns.some(c => c.includes("overdue"))).toBe(true);
    });

    it("flags expired vehicle documents", () => {
      const r = computeHomePremisesSafety(baseInput({
        vehicles: [makeVehicle({ mot_expiry: "2025-01-01" })],
      }));
      expect(r.concerns.some(c => c.includes("vehicle document"))).toBe(true);
    });

    it("flags urgent open maintenance", () => {
      const r = computeHomePremisesSafety(baseInput({
        maintenance: [makeMaintenance({ priority: "urgent", status: "open", due_date: "2025-06-20" })],
      }));
      expect(r.concerns.some(c => c.includes("urgent maintenance"))).toBe(true);
    });
  });

  // ── Recommendations ───────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends gas safety inspection when expired", () => {
      const r = computeHomePremisesSafety(baseInput({
        buildings: [makeBuilding({ gas_cert_expiry: "2025-01-01" })],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("gas safety"))).toBe(true);
      expect(r.recommendations[0].urgency).toBe("immediate");
    });

    it("recommends fire risk assessment when overdue", () => {
      const r = computeHomePremisesSafety(baseInput({
        buildings: [makeBuilding({ fire_risk_assessment_date: "2024-01-01" })],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("fire risk assessment"))).toBe(true);
    });

    it("recommends vehicle document renewal", () => {
      const r = computeHomePremisesSafety(baseInput({
        vehicles: [makeVehicle({ mot_expiry: "2025-01-01" })],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("vehicle documents"))).toBe(true);
    });

    it("recommends resolving urgent maintenance", () => {
      const r = computeHomePremisesSafety(baseInput({
        maintenance: [makeMaintenance({ priority: "urgent", status: "open", due_date: "2025-06-20" })],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("urgent maintenance"))).toBe(true);
    });
  });

  // ── Insights ──────────────────────────────────────────────────────

  describe("insights", () => {
    it("generates outstanding premises insight", () => {
      const r = computeHomePremisesSafety(baseInput({
        buildings: [makeBuilding()],
        building_checks: [makeCheck()],
        vehicles: [makeVehicle()],
        vehicle_checks: [makeVehicleCheck()],
        maintenance: [makeMaintenance({ status: "completed", due_date: "2025-06-01" })],
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("outstanding premises"))).toBe(true);
    });

    it("generates critical insight for expired building certs", () => {
      const r = computeHomePremisesSafety(baseInput({
        buildings: [makeBuilding({ gas_cert_expiry: "2025-01-01" })],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("certification"))).toBe(true);
    });

    it("generates critical insight for expired vehicle documents", () => {
      const r = computeHomePremisesSafety(baseInput({
        vehicles: [makeVehicle({ mot_expiry: "2025-01-01" })],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("vehicle document"))).toBe(true);
    });

    it("generates warning for overdue checks combined with fails", () => {
      const r = computeHomePremisesSafety(baseInput({
        building_checks: [
          makeCheck({ status: "overdue", result: "" }),
          makeCheck({ result: "fail" }),
        ],
      }));
      expect(r.insights.some(i => i.text.includes("overdue checks") && i.text.includes("failed"))).toBe(true);
    });

    it("generates critical insight for multiple urgent maintenance", () => {
      const r = computeHomePremisesSafety(baseInput({
        maintenance: [
          makeMaintenance({ priority: "urgent", status: "open", due_date: "2025-06-20" }),
          makeMaintenance({ priority: "urgent", status: "open", due_date: "2025-06-25" }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("urgent maintenance"))).toBe(true);
    });
  });

  // ── Headline ──────────────────────────────────────────────────────

  describe("headline", () => {
    it("uses outstanding headline for outstanding rating", () => {
      const r = computeHomePremisesSafety(baseInput({
        buildings: [makeBuilding()],
        building_checks: [makeCheck(), makeCheck()],
        vehicles: [makeVehicle()],
        vehicle_checks: [makeVehicleCheck()],
        maintenance: [makeMaintenance({ status: "completed", due_date: "2025-06-01" })],
      }));
      expect(r.headline).toContain("Outstanding premises safety");
    });

    it("uses inadequate headline for inadequate rating", () => {
      const r = computeHomePremisesSafety(baseInput({
        buildings: [makeBuilding({
          gas_cert_expiry: "2024-01-01",
          electrical_cert_expiry: "2024-06-01",
        })],
        building_checks: [
          makeCheck({ status: "overdue", result: "" }),
          makeCheck({ status: "overdue", result: "" }),
        ],
        vehicles: [makeVehicle({ mot_expiry: "2024-01-01", insurance_expiry: "2024-06-01" })],
        maintenance: [
          makeMaintenance({ priority: "urgent", status: "open", due_date: "2025-04-01" }),
          makeMaintenance({ priority: "urgent", status: "open", due_date: "2025-05-01" }),
        ],
      }));
      expect(r.headline).toContain("inadequate");
    });
  });

  // ── Edge Cases ────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles empty building checks gracefully", () => {
      const r = computeHomePremisesSafety(baseInput({
        buildings: [makeBuilding()],
      }));
      expect(r.check_profile.total_checks).toBe(0);
      expect(r.check_profile.pass_rate).toBeNull();
    });

    it("handles empty vehicle checks gracefully", () => {
      const r = computeHomePremisesSafety(baseInput({
        vehicles: [makeVehicle()],
      }));
      expect(r.vehicle_profile.checks_pass_count).toBe(0);
    });

    it("score is clamped to 0-100", () => {
      const r = computeHomePremisesSafety(baseInput({
        buildings: [makeBuilding()],
      }));
      expect(r.premises_score).toBeGreaterThanOrEqual(0);
      expect(r.premises_score).toBeLessThanOrEqual(100);
    });

    it("handles only maintenance data", () => {
      const r = computeHomePremisesSafety(baseInput({
        maintenance: [
          makeMaintenance({ status: "completed", due_date: "2025-06-01" }),
          makeMaintenance({ status: "open", due_date: "2025-07-01" }),
        ],
      }));
      expect(r.premises_rating).not.toBe("insufficient_data");
      expect(r.maintenance_profile.total_items).toBe(2);
    });

    it("handles all maintenance future-dated", () => {
      const r = computeHomePremisesSafety(baseInput({
        maintenance: [
          makeMaintenance({ status: "scheduled", due_date: "2025-07-01" }),
          makeMaintenance({ status: "open", due_date: "2025-08-01" }),
        ],
      }));
      // No due items, so completion rate = 0 (no denominator), but gets +1 for all future
      expect(r.maintenance_profile.overdue_count).toBe(0);
    });
  });
});
