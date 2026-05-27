import { describe, it, expect } from "vitest";
import {
  computeTransportJourneySafety,
  type TransportLogInput,
  type TransportRiskAssessmentInput,
  type VehicleCheckInput,
  type TransportJourneySafetyInput,
} from "../home-transport-journey-safety-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeLog(overrides: Partial<TransportLogInput> = {}): TransportLogInput {
  return {
    id: "log_1",
    driver_licence_checked: true,
    vehicle_checked: true,
    incident_during_journey: false,
    behaviour_during_journey: "good",
    has_risk_assessment: true,
    ...overrides,
  };
}

function makeRA(overrides: Partial<TransportRiskAssessmentInput> = {}): TransportRiskAssessmentInput {
  return {
    id: "ra_1",
    behaviour_risk_rating: "Low",
    missing_risk_rating: "Low",
    hazards_count: 3,
    mitigations_count: 3,
    signed_off_by_rm: true,
    in_use: true,
    needs_review: false,
    ...overrides,
  };
}

function makeVehicleCheck(overrides: Partial<VehicleCheckInput> = {}): VehicleCheckInput {
  return {
    id: "vc_1",
    defects_found_count: 0,
    tyres_checked: true,
    seatbelts_ok: true,
    first_aid_kit_present: true,
    insurance_confirmed: true,
    mot_valid: true,
    ...overrides,
  };
}

function baseInput(overrides: Partial<TransportJourneySafetyInput> = {}): TransportJourneySafetyInput {
  // 4 children, 20 logs all compliant, 5 RAs all signed off/in-use, 10 vehicle checks all defect-free
  // Expected: 52 +5(driver) +6(vehicle) +5(incidents 0%) +5(RA coverage) +4(defect-free) +5(RA quality) = 82
  return {
    today: "2026-05-27",
    total_children: 4,
    logs: Array.from({ length: 20 }, (_, i) => makeLog({ id: `log_${i}` })),
    risk_assessments: Array.from({ length: 5 }, (_, i) => makeRA({ id: `ra_${i}` })),
    vehicle_checks: Array.from({ length: 10 }, (_, i) => makeVehicleCheck({ id: `vc_${i}` })),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════

describe("computeTransportJourneySafety", () => {

  describe("insufficient_data", () => {
    it("returns insufficient_data when total_children = 0", () => {
      const r = computeTransportJourneySafety(baseInput({ total_children: 0 }));
      expect(r.transport_rating).toBe("insufficient_data");
      expect(r.transport_score).toBe(0);
    });

    it("returns empty arrays", () => {
      const r = computeTransportJourneySafety(baseInput({ total_children: 0 }));
      expect(r.strengths).toEqual([]);
      expect(r.recommendations).toEqual([]);
    });

    it("returns correct headline", () => {
      const r = computeTransportJourneySafety(baseInput({ total_children: 0 }));
      expect(r.headline).toBe("No data available for transport safety analysis");
    });
  });

  describe("outstanding rating", () => {
    it("returns score 82 and outstanding for base", () => {
      const r = computeTransportJourneySafety(baseInput());
      expect(r.transport_score).toBe(82);
      expect(r.transport_rating).toBe("outstanding");
    });

    it("has correct headline", () => {
      const r = computeTransportJourneySafety(baseInput());
      expect(r.headline).toContain("exemplary");
    });
  });

  describe("good rating", () => {
    it("achieves good with moderate metrics", () => {
      const logs = Array.from({ length: 20 }, (_, i) => makeLog({
        id: `l_${i}`,
        driver_licence_checked: i < 18,
        vehicle_checked: i < 18,
      }));
      const r = computeTransportJourneySafety(baseInput({ logs }));
      // driver: 18/20=90%→+2, vehicle: 90%→+2
      // 52+2+2+5+5+4+5 = 75
      expect(r.transport_score).toBe(75);
      expect(r.transport_rating).toBe("good");
    });
  });

  describe("adequate rating", () => {
    it("achieves adequate with weaknesses", () => {
      const logs = Array.from({ length: 20 }, (_, i) => makeLog({
        id: `l_${i}`,
        driver_licence_checked: i < 14,
        vehicle_checked: i < 10,
        incident_during_journey: i < 4,
        has_risk_assessment: i < 14,
      }));
      const r = computeTransportJourneySafety(baseInput({ logs }));
      // driver: 14/20=70%→-5, vehicle: 10/20=50%→-5(but <60), incident: 4/20=20%→-5(>15)
      // RA: 14/20=70%→+2(>=80? No 70 not >=80)→ between 60-79→0 modifier
      // Actually wait: 70% is >= 60, so no penalty. But also not >= 80. So 0.
      // 52-5-5-5+0+4+5 = 46
      expect(r.transport_score).toBe(46);
      expect(r.transport_rating).toBe("adequate");
    });
  });

  describe("inadequate rating", () => {
    it("achieves inadequate with severe deficiencies", () => {
      const logs = Array.from({ length: 20 }, (_, i) => makeLog({
        id: `l_${i}`,
        driver_licence_checked: i < 5,
        vehicle_checked: i < 5,
        incident_during_journey: i < 5,
        has_risk_assessment: i < 5,
      }));
      const vehicleChecks = Array.from({ length: 10 }, (_, i) => makeVehicleCheck({
        id: `vc_${i}`,
        defects_found_count: i < 6 ? 3 : 0,
      }));
      const r = computeTransportJourneySafety(baseInput({ logs, vehicle_checks: vehicleChecks }));
      // driver: 25%→-5, vehicle: 25%→-5, incident: 25%→-5, RA: 25%→-4
      // defects: 4/10=40%→-4, RA quality: still +5 (all signed off)
      // 52-5-5-5-4-4+5 = 34
      expect(r.transport_score).toBe(34);
      expect(r.transport_rating).toBe("inadequate");
    });

    it("has correct headline", () => {
      const logs = [makeLog({
        driver_licence_checked: false,
        vehicle_checked: false,
        incident_during_journey: true,
        has_risk_assessment: false,
      })];
      const r = computeTransportJourneySafety(baseInput({ logs, risk_assessments: [], vehicle_checks: [] }));
      expect(r.transport_rating).toBe("inadequate");
      expect(r.headline).toContain("inadequate");
    });
  });

  // ── Modifier 1: Driver compliance ────────────────────────────────────
  describe("modifier: driver compliance", () => {
    it("+5 when >= 95%", () => {
      const r = computeTransportJourneySafety(baseInput());
      expect(r.driver_compliance_rate).toBe(100);
      expect(r.transport_score).toBe(82);
    });

    it("+2 when 80-94%", () => {
      const logs = Array.from({ length: 20 }, (_, i) => makeLog({
        id: `l_${i}`,
        driver_licence_checked: i < 18,
      }));
      const r = computeTransportJourneySafety(baseInput({ logs }));
      // 90%→+2. 82-5+2 = 79
      expect(r.transport_score).toBe(79);
    });

    it("-5 when < 80%", () => {
      const logs = Array.from({ length: 20 }, (_, i) => makeLog({
        id: `l_${i}`,
        driver_licence_checked: i < 10,
      }));
      const r = computeTransportJourneySafety(baseInput({ logs }));
      // 50%→-5. 82-5-5 = 72
      expect(r.transport_score).toBe(72);
    });

    it("+1 when 0 journeys", () => {
      const r = computeTransportJourneySafety(baseInput({ logs: [] }));
      // mod1:+1, mod2:0, mod3:+2, mod4:-1, mod5 from checks still +4, mod6 from RAs still +5
      // 52+1+0+2-1+4+5 = 63
      expect(r.transport_score).toBe(63);
    });
  });

  // ── Modifier 2: Vehicle check rate ───────────────────────────────────
  describe("modifier: vehicle check rate", () => {
    it("+6 when >= 95%", () => {
      const r = computeTransportJourneySafety(baseInput());
      expect(r.vehicle_check_rate).toBe(100);
    });

    it("+2 when 80-94%", () => {
      const logs = Array.from({ length: 20 }, (_, i) => makeLog({
        id: `l_${i}`,
        vehicle_checked: i < 18,
      }));
      const r = computeTransportJourneySafety(baseInput({ logs }));
      // 82-6+2 = 78
      expect(r.transport_score).toBe(78);
    });

    it("-5 when < 60%", () => {
      const logs = Array.from({ length: 20 }, (_, i) => makeLog({
        id: `l_${i}`,
        vehicle_checked: i < 10,
      }));
      const r = computeTransportJourneySafety(baseInput({ logs }));
      // 50%→-5. 82-6-5 = 71
      expect(r.transport_score).toBe(71);
    });
  });

  // ── Modifier 3: Incident rate ────────────────────────────────────────
  describe("modifier: incident rate", () => {
    it("+5 when 0%", () => {
      const r = computeTransportJourneySafety(baseInput());
      expect(r.incident_rate).toBe(0);
    });

    it("+2 when <= 5%", () => {
      const logs = Array.from({ length: 20 }, (_, i) => makeLog({
        id: `l_${i}`,
        incident_during_journey: i === 0,
      }));
      const r = computeTransportJourneySafety(baseInput({ logs }));
      // 1/20=5%→+2. 82-5+2 = 79
      expect(r.transport_score).toBe(79);
    });

    it("-5 when > 15%", () => {
      const logs = Array.from({ length: 20 }, (_, i) => makeLog({
        id: `l_${i}`,
        incident_during_journey: i < 4,
      }));
      const r = computeTransportJourneySafety(baseInput({ logs }));
      // 4/20=20%→-5. 82-5-5 = 72
      expect(r.transport_score).toBe(72);
    });
  });

  // ── Modifier 4: RA coverage ──────────────────────────────────────────
  describe("modifier: risk assessment coverage", () => {
    it("+5 when >= 95%", () => {
      const r = computeTransportJourneySafety(baseInput());
      expect(r.risk_assessment_coverage_rate).toBe(100);
    });

    it("-4 when < 60%", () => {
      const logs = Array.from({ length: 20 }, (_, i) => makeLog({
        id: `l_${i}`,
        has_risk_assessment: i < 10,
      }));
      const r = computeTransportJourneySafety(baseInput({ logs }));
      // 50%→-4. 82-5-4 = 73
      expect(r.transport_score).toBe(73);
    });
  });

  // ── Modifier 5: Defect-free rate ─────────────────────────────────────
  describe("modifier: defect-free rate", () => {
    it("+4 when >= 90%", () => {
      const r = computeTransportJourneySafety(baseInput());
      expect(r.defect_free_rate).toBe(100);
    });

    it("-4 when < 50%", () => {
      const vehicleChecks = Array.from({ length: 10 }, (_, i) => makeVehicleCheck({
        id: `vc_${i}`,
        defects_found_count: i < 6 ? 2 : 0,
      }));
      const r = computeTransportJourneySafety(baseInput({ vehicle_checks: vehicleChecks }));
      // 4/10=40%→-4. 82-4-4 = 74
      expect(r.transport_score).toBe(74);
    });

    it("-2 when no vehicle checks", () => {
      const r = computeTransportJourneySafety(baseInput({ vehicle_checks: [] }));
      // 82-4-2 = 76
      expect(r.transport_score).toBe(76);
    });
  });

  // ── Modifier 6: RA quality ───────────────────────────────────────────
  describe("modifier: risk assessment quality", () => {
    it("+5 when all signed off and none need review", () => {
      const r = computeTransportJourneySafety(baseInput());
      expect(r.transport_score).toBe(82);
    });

    it("+2 when signed off rate 70-89%", () => {
      const ras = Array.from({ length: 5 }, (_, i) => makeRA({
        id: `ra_${i}`,
        signed_off_by_rm: i < 4,
      }));
      const r = computeTransportJourneySafety(baseInput({ risk_assessments: ras }));
      // 4/5=80%→+2. 82-5+2 = 79
      expect(r.transport_score).toBe(79);
    });

    it("-5 when signed off rate < 50%", () => {
      const ras = Array.from({ length: 5 }, (_, i) => makeRA({
        id: `ra_${i}`,
        signed_off_by_rm: i < 2,
      }));
      const r = computeTransportJourneySafety(baseInput({ risk_assessments: ras }));
      // 2/5=40%→-5. 82-5-5 = 72
      expect(r.transport_score).toBe(72);
    });

    it("-2 when no risk assessments", () => {
      const r = computeTransportJourneySafety(baseInput({ risk_assessments: [] }));
      // 82-5-2 = 75
      expect(r.transport_score).toBe(75);
    });

    it("+2 not +5 when signed off but some need review", () => {
      const ras = Array.from({ length: 5 }, (_, i) => makeRA({
        id: `ra_${i}`,
        signed_off_by_rm: true,
        needs_review: i === 0,
      }));
      const r = computeTransportJourneySafety(baseInput({ risk_assessments: ras }));
      // signedOff 100% but needsReview=1 → condition fails, falls to >=70% → +2
      // 82-5+2 = 79
      expect(r.transport_score).toBe(79);
    });
  });

  // ── Metrics ──────────────────────────────────────────────────────────
  describe("metrics", () => {
    it("calculates total_journeys", () => {
      const r = computeTransportJourneySafety(baseInput());
      expect(r.total_journeys).toBe(20);
    });

    it("calculates incident_rate correctly", () => {
      const logs = Array.from({ length: 10 }, (_, i) => makeLog({
        id: `l_${i}`,
        incident_during_journey: i < 3,
      }));
      const r = computeTransportJourneySafety(baseInput({ logs }));
      expect(r.incident_rate).toBe(30);
    });

    it("calculates defect_free_rate correctly", () => {
      const vehicleChecks = [
        makeVehicleCheck({ id: "a", defects_found_count: 0 }),
        makeVehicleCheck({ id: "b", defects_found_count: 2 }),
        makeVehicleCheck({ id: "c", defects_found_count: 0 }),
      ];
      const r = computeTransportJourneySafety(baseInput({ vehicle_checks: vehicleChecks }));
      expect(r.defect_free_rate).toBe(67);
    });
  });

  // ── Strengths ────────────────────────────────────────────────────────
  describe("strengths", () => {
    it("includes multiple strengths for outstanding", () => {
      const r = computeTransportJourneySafety(baseInput());
      expect(r.strengths.length).toBeGreaterThan(3);
    });

    it("has no strengths when everything is poor", () => {
      const logs = [makeLog({
        driver_licence_checked: false, vehicle_checked: false,
        incident_during_journey: true, has_risk_assessment: false,
      })];
      const r = computeTransportJourneySafety(baseInput({ logs, risk_assessments: [], vehicle_checks: [] }));
      expect(r.strengths.length).toBe(0);
    });
  });

  // ── Concerns ─────────────────────────────────────────────────────────
  describe("concerns", () => {
    it("flags low driver compliance", () => {
      const logs = Array.from({ length: 20 }, (_, i) => makeLog({
        id: `l_${i}`,
        driver_licence_checked: i < 5,
      }));
      const r = computeTransportJourneySafety(baseInput({ logs }));
      expect(r.concerns.some(c => c.includes("river") || c.includes("licence"))).toBe(true);
    });

    it("has no concerns for outstanding", () => {
      const r = computeTransportJourneySafety(baseInput());
      expect(r.concerns.length).toBe(0);
    });
  });

  // ── Recommendations ──────────────────────────────────────────────────
  describe("recommendations", () => {
    it("generates recommendations for poor compliance", () => {
      const logs = Array.from({ length: 20 }, (_, i) => makeLog({
        id: `l_${i}`,
        driver_licence_checked: i < 5,
        vehicle_checked: i < 5,
      }));
      const r = computeTransportJourneySafety(baseInput({ logs }));
      expect(r.recommendations.length).toBeGreaterThan(0);
    });

    it("caps at 5", () => {
      const logs = Array.from({ length: 20 }, (_, i) => makeLog({
        id: `l_${i}`,
        driver_licence_checked: false,
        vehicle_checked: false,
        incident_during_journey: i < 5,
        has_risk_assessment: false,
      }));
      const vehicleChecks = Array.from({ length: 10 }, (_, i) => makeVehicleCheck({
        id: `vc_${i}`,
        defects_found_count: 3,
      }));
      const ras = Array.from({ length: 3 }, (_, i) => makeRA({
        id: `ra_${i}`,
        needs_review: true,
      }));
      const r = computeTransportJourneySafety(baseInput({ logs, vehicle_checks: vehicleChecks, risk_assessments: ras }));
      expect(r.recommendations.length).toBeLessThan(6);
    });

    it("has sequential ranks", () => {
      const logs = Array.from({ length: 20 }, (_, i) => makeLog({
        id: `l_${i}`,
        driver_licence_checked: false,
        vehicle_checked: false,
      }));
      const r = computeTransportJourneySafety(baseInput({ logs }));
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("all have regulatory ref CHR 2015 Reg 25", () => {
      const logs = Array.from({ length: 20 }, (_, i) => makeLog({
        id: `l_${i}`,
        driver_licence_checked: false,
      }));
      const r = computeTransportJourneySafety(baseInput({ logs }));
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref).toBe("CHR 2015 Reg 25");
      }
    });

    it("returns empty for outstanding", () => {
      const r = computeTransportJourneySafety(baseInput());
      expect(r.recommendations.length).toBe(0);
    });
  });

  // ── Insights ─────────────────────────────────────────────────────────
  describe("insights", () => {
    it("generates positive insight for excellent compliance", () => {
      const r = computeTransportJourneySafety(baseInput());
      expect(r.insights.some(i => i.severity === "positive")).toBe(true);
    });

    it("generates critical insight for unchecked drivers", () => {
      const logs = Array.from({ length: 20 }, (_, i) => makeLog({
        id: `l_${i}`,
        driver_licence_checked: i < 5,
      }));
      const r = computeTransportJourneySafety(baseInput({ logs }));
      expect(r.insights.some(i => i.severity === "critical")).toBe(true);
    });

    it("caps at 3", () => {
      const r = computeTransportJourneySafety(baseInput());
      expect(r.insights.length).toBeLessThan(4);
    });
  });

  // ── Score clamping ───────────────────────────────────────────────────
  describe("score clamping", () => {
    it("clamps to minimum 0", () => {
      const logs = Array.from({ length: 100 }, (_, i) => makeLog({
        id: `l_${i}`,
        driver_licence_checked: false,
        vehicle_checked: false,
        incident_during_journey: true,
        has_risk_assessment: false,
      }));
      const vehicleChecks = Array.from({ length: 10 }, (_, i) => makeVehicleCheck({
        id: `vc_${i}`,
        defects_found_count: 5,
      }));
      const ras = [makeRA({ signed_off_by_rm: false })];
      const r = computeTransportJourneySafety(baseInput({ logs, vehicle_checks: vehicleChecks, risk_assessments: ras }));
      expect(r.transport_score).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Edge cases ───────────────────────────────────────────────────────
  describe("edge cases", () => {
    it("handles single journey", () => {
      const r = computeTransportJourneySafety(baseInput({
        logs: [makeLog()],
        risk_assessments: [makeRA()],
        vehicle_checks: [makeVehicleCheck()],
      }));
      expect(r.total_journeys).toBe(1);
    });

    it("return shape has all fields", () => {
      const r = computeTransportJourneySafety(baseInput());
      expect(r).toHaveProperty("transport_rating");
      expect(r).toHaveProperty("transport_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("total_journeys");
      expect(r).toHaveProperty("driver_compliance_rate");
      expect(r).toHaveProperty("vehicle_check_rate");
      expect(r).toHaveProperty("incident_rate");
      expect(r).toHaveProperty("risk_assessment_coverage_rate");
      expect(r).toHaveProperty("defect_free_rate");
    });
  });
});
