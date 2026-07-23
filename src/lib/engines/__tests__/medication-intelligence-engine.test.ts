// ══════════════════════════════════════════════════════════════════════════════
// CARA — MEDICATION INTELLIGENCE ENGINE — TEST SUITE
// Reg 23/12 — health provision, safe medication administration
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeMedicationIntelligence,
  daysBetween,
  average,
  type ChildInput,
  type MedicationInput,
  type AdministrationInput,
  type MedicationIntelligenceInput,
} from "../medication-intelligence-engine";

// ── Factories ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-25";

function makeChild(overrides: Partial<ChildInput> = {}): ChildInput {
  return { id: "yp_casey", name: "Casey", ...overrides };
}

function makeMedication(overrides: Partial<MedicationInput> = {}): MedicationInput {
  return {
    id: "med_1",
    child_id: "yp_casey",
    name: "Fluoxetine 10mg",
    type: "regular",
    dosage: "10mg",
    is_active: true,
    stock_count: 22,
    stock_last_checked: "2026-05-23",
    ...overrides,
  };
}

function makeAdmin(overrides: Partial<AdministrationInput> = {}): AdministrationInput {
  return {
    id: "adm_1",
    medication_id: "med_1",
    child_id: "yp_casey",
    scheduled_time: "2026-05-20T08:00:00Z",
    actual_time: "2026-05-20T08:05:00Z",
    status: "given",
    administered_by: "staff_1",
    witnessed_by: "staff_2",
    dose_given: "10mg",
    reason_not_given: null,
    prn_reason: null,
    prn_effectiveness: null,
    ...overrides,
  };
}

// ── Unit Tests: Helpers ───────────────────────────────────────────────────────

describe("daysBetween", () => {
  it("returns 0 for same day", () => {
    expect(daysBetween("2026-05-25", "2026-05-25")).toBe(0);
  });

  it("returns correct days", () => {
    expect(daysBetween("2026-05-20", "2026-05-25")).toBe(5);
  });
});

describe("average", () => {
  it("returns 0 for empty", () => {
    expect(average([])).toBe(0);
  });

  it("computes correctly", () => {
    expect(average([80, 90, 100])).toBe(90);
  });
});

// ── Integration Tests ─────────────────────────────────────────────────────────

describe("computeMedicationIntelligence", () => {
  describe("empty state", () => {
    it("handles no data gracefully", () => {
      const result = computeMedicationIntelligence({
        children: [makeChild()],
        medications: [],
        administrations: [],
        today: TODAY,
      });

      expect(result.overview.total_active_medications).toBe(0);
      expect(result.overview.total_administrations_30d).toBe(0);
      // No doses due and no active meds — adherence and stock compliance are
      // unmeasured, not a fabricated 0%/100%.
      expect(result.overview.adherence_rate).toBeNull();
      expect(result.overview.stock_check_compliance).toBeNull();
      expect(result.child_profiles).toHaveLength(0);
      expect(result.alerts).toHaveLength(0);
      expect(result.insights).toHaveLength(0);
    });
  });

  describe("overview", () => {
    it("counts active medications correctly", () => {
      const meds = [
        makeMedication({ id: "m1", is_active: true }),
        makeMedication({ id: "m2", is_active: true }),
        makeMedication({ id: "m3", is_active: false }),
      ];

      const result = computeMedicationIntelligence({
        children: [makeChild()],
        medications: meds,
        administrations: [],
        today: TODAY,
      });

      expect(result.overview.total_active_medications).toBe(2);
    });

    it("computes adherence rate correctly", () => {
      const admins: AdministrationInput[] = [
        makeAdmin({ id: "a1", status: "given" }),
        makeAdmin({ id: "a2", status: "given" }),
        makeAdmin({ id: "a3", status: "late" }),
        makeAdmin({ id: "a4", status: "refused" }),
        makeAdmin({ id: "a5", status: "missed" }),
      ];

      const result = computeMedicationIntelligence({
        children: [makeChild()],
        medications: [makeMedication()],
        administrations: admins,
        today: TODAY,
      });

      // adherence = (given + late) / total = (2 + 1) / 5 = 60%
      expect(result.overview.adherence_rate).toBe(60);
      expect(result.overview.refusal_rate).toBe(20);
      expect(result.overview.late_rate).toBe(20);
      expect(result.overview.missed_rate).toBe(20);
    });

    it("excludes scheduled (future) doses from calculations", () => {
      const admins: AdministrationInput[] = [
        makeAdmin({ id: "a1", status: "given", scheduled_time: "2026-05-20T08:00:00Z" }),
        makeAdmin({ id: "a2", status: "scheduled", scheduled_time: "2026-05-26T08:00:00Z" }),
      ];

      const result = computeMedicationIntelligence({
        children: [makeChild()],
        medications: [makeMedication()],
        administrations: admins,
        today: TODAY,
      });

      expect(result.overview.total_administrations_30d).toBe(1);
    });

    it("excludes administrations older than 30 days", () => {
      const admins: AdministrationInput[] = [
        makeAdmin({ id: "a1", status: "given", scheduled_time: "2026-05-20T08:00:00Z" }),
        makeAdmin({ id: "a2", status: "given", scheduled_time: "2026-04-10T08:00:00Z" }), // 45 days ago
      ];

      const result = computeMedicationIntelligence({
        children: [makeChild()],
        medications: [makeMedication()],
        administrations: admins,
        today: TODAY,
      });

      expect(result.overview.total_administrations_30d).toBe(1);
    });

    it("computes witnessing rate", () => {
      const admins: AdministrationInput[] = [
        makeAdmin({ id: "a1", witnessed_by: "staff_2" }),
        makeAdmin({ id: "a2", witnessed_by: "staff_3" }),
        makeAdmin({ id: "a3", witnessed_by: null }),
      ];

      const result = computeMedicationIntelligence({
        children: [makeChild()],
        medications: [makeMedication()],
        administrations: admins,
        today: TODAY,
      });

      expect(result.overview.witnessing_rate).toBe(67);
    });

    it("computes stock check compliance", () => {
      const meds = [
        makeMedication({ id: "m1", stock_last_checked: "2026-05-23" }), // 2 days ago — compliant
        makeMedication({ id: "m2", stock_last_checked: "2026-05-10" }), // 15 days ago — overdue
        makeMedication({ id: "m3", stock_last_checked: null }),          // never — overdue
      ];

      const result = computeMedicationIntelligence({
        children: [makeChild()],
        medications: meds,
        administrations: [],
        today: TODAY,
      });

      expect(result.overview.stock_check_compliance).toBe(33); // 1/3
    });

    it("counts PRN administrations", () => {
      const meds = [
        makeMedication({ id: "med_prn", type: "prn" }),
        makeMedication({ id: "med_reg", type: "regular" }),
      ];
      const admins: AdministrationInput[] = [
        makeAdmin({ id: "a1", medication_id: "med_prn", prn_reason: "headache", prn_effectiveness: "effective" }),
        makeAdmin({ id: "a2", medication_id: "med_prn", prn_reason: "pain", prn_effectiveness: "partial" }),
        makeAdmin({ id: "a3", medication_id: "med_reg" }),
      ];

      const result = computeMedicationIntelligence({
        children: [makeChild()],
        medications: meds,
        administrations: admins,
        today: TODAY,
      });

      expect(result.overview.prn_administrations_30d).toBe(2);
    });
  });

  describe("child profiles", () => {
    it("creates profiles only for children with active medications", () => {
      const children = [
        makeChild({ id: "yp_casey", name: "Casey" }),
        makeChild({ id: "yp_jordan", name: "Jordan" }),
      ];
      const meds = [
        makeMedication({ id: "m1", child_id: "yp_casey" }),
      ];

      const result = computeMedicationIntelligence({
        children,
        medications: meds,
        administrations: [],
        today: TODAY,
      });

      expect(result.child_profiles).toHaveLength(1);
      expect(result.child_profiles[0].child_name).toBe("Casey");
    });

    it("classifies compliance status correctly", () => {
      const meds = [makeMedication()];

      // Excellent: 100% adherence, 0 refusals, 0 missed
      const adminsExcellent: AdministrationInput[] = Array.from({ length: 10 }, (_, i) =>
        makeAdmin({ id: `a${i}`, status: "given" }),
      );
      const r1 = computeMedicationIntelligence({
        children: [makeChild()], medications: meds, administrations: adminsExcellent, today: TODAY,
      });
      expect(r1.child_profiles[0].compliance_status).toBe("excellent");

      // Good: 90% adherence (1 refused out of 10)
      const adminsGood: AdministrationInput[] = [
        ...Array.from({ length: 9 }, (_, i) => makeAdmin({ id: `a${i}`, status: "given" })),
        makeAdmin({ id: "a9", status: "refused" }),
      ];
      const r2 = computeMedicationIntelligence({
        children: [makeChild()], medications: meds, administrations: adminsGood, today: TODAY,
      });
      expect(r2.child_profiles[0].compliance_status).toBe("good");

      // Concerns: 75% adherence
      const adminsConcerns: AdministrationInput[] = [
        ...Array.from({ length: 3 }, (_, i) => makeAdmin({ id: `a${i}`, status: "given" })),
        makeAdmin({ id: "a3", status: "refused" }),
      ];
      const r3 = computeMedicationIntelligence({
        children: [makeChild()], medications: meds, administrations: adminsConcerns, today: TODAY,
      });
      expect(r3.child_profiles[0].compliance_status).toBe("concerns");

      // Critical: 50% adherence
      const adminsCritical: AdministrationInput[] = [
        makeAdmin({ id: "a0", status: "given" }),
        makeAdmin({ id: "a1", status: "missed" }),
      ];
      const r4 = computeMedicationIntelligence({
        children: [makeChild()], medications: meds, administrations: adminsCritical, today: TODAY,
      });
      expect(r4.child_profiles[0].compliance_status).toBe("critical");
    });
  });

  describe("medication details", () => {
    it("creates details for each active medication", () => {
      const meds = [
        makeMedication({ id: "m1", name: "Fluoxetine" }),
        makeMedication({ id: "m2", name: "Melatonin" }),
      ];
      const admins: AdministrationInput[] = [
        makeAdmin({ id: "a1", medication_id: "m1", status: "given" }),
        makeAdmin({ id: "a2", medication_id: "m1", status: "given" }),
        makeAdmin({ id: "a3", medication_id: "m2", status: "late" }),
      ];

      const result = computeMedicationIntelligence({
        children: [makeChild()],
        medications: meds,
        administrations: admins,
        today: TODAY,
      });

      expect(result.medication_details).toHaveLength(2);
      const fluox = result.medication_details.find((d) => d.medication_name === "Fluoxetine")!;
      expect(fluox.administrations_30d).toBe(2);
      expect(fluox.adherence_rate).toBe(100);

      const mela = result.medication_details.find((d) => d.medication_name === "Melatonin")!;
      expect(mela.administrations_30d).toBe(1);
      expect(mela.late_count).toBe(1);
      expect(mela.adherence_rate).toBe(100); // late still counts as adhered
    });

    it("flags low stock correctly", () => {
      const meds = [
        makeMedication({ id: "m1", stock_count: 5 }),  // low
        makeMedication({ id: "m2", stock_count: 20 }), // fine
        makeMedication({ id: "m3", stock_count: null }), // unknown
      ];

      const result = computeMedicationIntelligence({
        children: [makeChild()],
        medications: meds,
        administrations: [],
        today: TODAY,
      });

      expect(result.medication_details[0].stock_low).toBe(true);
      expect(result.medication_details[1].stock_low).toBe(false);
      expect(result.medication_details[2].stock_low).toBe(false);
    });
  });

  describe("PRN analysis", () => {
    it("groups PRN by medication", () => {
      const meds = [
        makeMedication({ id: "prn1", name: "Ibuprofen", type: "prn" }),
        makeMedication({ id: "prn2", name: "Piriton", type: "prn" }),
      ];
      const admins: AdministrationInput[] = [
        makeAdmin({ id: "a1", medication_id: "prn1", prn_reason: "headache", prn_effectiveness: "effective" }),
        makeAdmin({ id: "a2", medication_id: "prn1", prn_reason: "knee pain", prn_effectiveness: "partial" }),
        makeAdmin({ id: "a3", medication_id: "prn2", prn_reason: "rash", prn_effectiveness: "effective" }),
      ];

      const result = computeMedicationIntelligence({
        children: [makeChild()],
        medications: meds,
        administrations: admins,
        today: TODAY,
      });

      expect(result.prn_analysis.total_prn_30d).toBe(3);
      expect(result.prn_analysis.by_medication[0].name).toBe("Ibuprofen");
      expect(result.prn_analysis.by_medication[0].count).toBe(2);
      expect(result.prn_analysis.effectiveness_rate).toBe(100);
    });

    it("computes effectiveness rate when some missing", () => {
      const meds = [makeMedication({ id: "prn1", type: "prn" })];
      const admins: AdministrationInput[] = [
        makeAdmin({ id: "a1", medication_id: "prn1", prn_reason: "pain", prn_effectiveness: "effective" }),
        makeAdmin({ id: "a2", medication_id: "prn1", prn_reason: "pain", prn_effectiveness: null }),
      ];

      const result = computeMedicationIntelligence({
        children: [makeChild()],
        medications: meds,
        administrations: admins,
        today: TODAY,
      });

      expect(result.prn_analysis.effectiveness_rate).toBe(50);
    });
  });

  describe("alerts", () => {
    it("generates critical alert for missed doses", () => {
      const admins: AdministrationInput[] = [
        makeAdmin({ id: "a1", status: "missed" }),
        makeAdmin({ id: "a2", status: "missed" }),
      ];

      const result = computeMedicationIntelligence({
        children: [makeChild()],
        medications: [makeMedication()],
        administrations: admins,
        today: TODAY,
      });

      const critical = result.alerts.filter((a) => a.severity === "critical");
      expect(critical.some((a) => a.message.includes("2 medication doses missed"))).toBe(true);
    });

    it("generates high alert for repeated refusals", () => {
      const admins: AdministrationInput[] = [
        makeAdmin({ id: "a1", status: "refused" }),
        makeAdmin({ id: "a2", status: "refused" }),
        makeAdmin({ id: "a3", status: "refused" }),
        makeAdmin({ id: "a4", status: "given" }),
      ];

      const result = computeMedicationIntelligence({
        children: [makeChild()],
        medications: [makeMedication()],
        administrations: admins,
        today: TODAY,
      });

      const high = result.alerts.filter((a) => a.severity === "high");
      expect(high.some((a) => a.message.includes("Casey refused medication 3 times"))).toBe(true);
    });

    it("generates high alert for low stock", () => {
      const meds = [makeMedication({ id: "m1", stock_count: 3 })];

      const result = computeMedicationIntelligence({
        children: [makeChild()],
        medications: meds,
        administrations: [],
        today: TODAY,
      });

      const high = result.alerts.filter((a) => a.severity === "high");
      expect(high.some((a) => a.message.includes("running low on stock"))).toBe(true);
    });

    it("generates medium alert for low witnessing", () => {
      const admins: AdministrationInput[] = [
        makeAdmin({ id: "a1", witnessed_by: "staff_2" }),
        makeAdmin({ id: "a2", witnessed_by: null }),
        makeAdmin({ id: "a3", witnessed_by: null }),
      ];

      const result = computeMedicationIntelligence({
        children: [makeChild()],
        medications: [makeMedication()],
        administrations: admins,
        today: TODAY,
      });

      const medium = result.alerts.filter((a) => a.severity === "medium");
      expect(medium.some((a) => a.message.includes("Witnessing rate"))).toBe(true);
    });

    it("generates no alerts when fully compliant", () => {
      const meds = [makeMedication({ stock_count: 20, stock_last_checked: "2026-05-23" })];
      const admins: AdministrationInput[] = Array.from({ length: 5 }, (_, i) =>
        makeAdmin({ id: `a${i}`, status: "given", witnessed_by: "staff_2" }),
      );

      const result = computeMedicationIntelligence({
        children: [makeChild()],
        medications: meds,
        administrations: admins,
        today: TODAY,
      });

      const critical = result.alerts.filter((a) => a.severity === "critical");
      const high = result.alerts.filter((a) => a.severity === "high");
      expect(critical).toHaveLength(0);
      expect(high).toHaveLength(0);
    });
  });

  describe("Cara insights", () => {
    it("generates critical insight for missed doses", () => {
      const admins: AdministrationInput[] = [
        makeAdmin({ id: "a1", status: "missed" }),
      ];

      const result = computeMedicationIntelligence({
        children: [makeChild()],
        medications: [makeMedication()],
        administrations: admins,
        today: TODAY,
      });

      const critical = result.insights.filter((i) => i.severity === "critical");
      expect(critical.some((c) => c.text.includes("Reg 23"))).toBe(true);
    });

    it("generates warning for refusals", () => {
      const admins: AdministrationInput[] = [
        makeAdmin({ id: "a1", status: "refused" }),
        makeAdmin({ id: "a2", status: "refused" }),
        makeAdmin({ id: "a3", status: "given" }),
      ];

      const result = computeMedicationIntelligence({
        children: [makeChild()],
        medications: [makeMedication()],
        administrations: admins,
        today: TODAY,
      });

      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((w) => w.text.includes("refusal"))).toBe(true);
    });

    it("generates positive insight for excellent adherence", () => {
      const admins: AdministrationInput[] = Array.from({ length: 10 }, (_, i) =>
        makeAdmin({ id: `a${i}`, status: "given", witnessed_by: "staff_2" }),
      );

      const result = computeMedicationIntelligence({
        children: [makeChild()],
        medications: [makeMedication()],
        administrations: admins,
        today: TODAY,
      });

      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("100% medication adherence"))).toBe(true);
    });

    it("generates positive insight for full witnessing", () => {
      const admins: AdministrationInput[] = Array.from({ length: 5 }, (_, i) =>
        makeAdmin({ id: `a${i}`, status: "given", witnessed_by: "staff_2" }),
      );

      const result = computeMedicationIntelligence({
        children: [makeChild()],
        medications: [makeMedication()],
        administrations: admins,
        today: TODAY,
      });

      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("100% witnessing compliance"))).toBe(true);
    });
  });

  describe("full Chamberlain House integration", () => {
    it("processes realistic multi-child medication data", () => {
      const children: ChildInput[] = [
        { id: "yp_casey", name: "Casey" },
        { id: "yp_alex", name: "Alex" },
        { id: "yp_jordan", name: "Jordan" },
      ];

      const medications: MedicationInput[] = [
        { id: "med_001", child_id: "yp_casey", name: "Melatonin", type: "regular", dosage: "3mg", is_active: true, stock_count: 18, stock_last_checked: "2026-05-23" },
        { id: "med_002", child_id: "yp_casey", name: "Fluoxetine", type: "regular", dosage: "10mg", is_active: true, stock_count: 22, stock_last_checked: "2026-05-23" },
        { id: "med_003", child_id: "yp_alex", name: "Ibuprofen", type: "prn", dosage: "200mg", is_active: true, stock_count: 30, stock_last_checked: "2026-05-22" },
        { id: "med_004", child_id: "yp_jordan", name: "Piriton", type: "prn", dosage: "4mg", is_active: true, stock_count: 15, stock_last_checked: "2026-05-23" },
      ];

      const administrations: AdministrationInput[] = [
        // Casey Fluoxetine — 5 days
        makeAdmin({ id: "m1", medication_id: "med_002", child_id: "yp_casey", scheduled_time: "2026-05-20T08:00:00Z", actual_time: "2026-05-20T08:05:00Z", status: "given" }),
        makeAdmin({ id: "m2", medication_id: "med_002", child_id: "yp_casey", scheduled_time: "2026-05-21T08:00:00Z", actual_time: "2026-05-21T08:10:00Z", status: "given" }),
        makeAdmin({ id: "m3", medication_id: "med_002", child_id: "yp_casey", scheduled_time: "2026-05-22T08:00:00Z", actual_time: "2026-05-22T08:45:00Z", status: "late" }),
        makeAdmin({ id: "m4", medication_id: "med_002", child_id: "yp_casey", scheduled_time: "2026-05-23T08:00:00Z", actual_time: "2026-05-23T08:08:00Z", status: "given" }),
        makeAdmin({ id: "m5", medication_id: "med_002", child_id: "yp_casey", scheduled_time: "2026-05-24T08:00:00Z", actual_time: "2026-05-24T08:03:00Z", status: "given" }),
        // Casey Melatonin — 5 nights
        makeAdmin({ id: "m10", medication_id: "med_001", child_id: "yp_casey", scheduled_time: "2026-05-20T21:30:00Z", actual_time: "2026-05-20T21:35:00Z", status: "given" }),
        makeAdmin({ id: "m11", medication_id: "med_001", child_id: "yp_casey", scheduled_time: "2026-05-21T21:30:00Z", actual_time: "2026-05-21T22:15:00Z", status: "late" }),
        makeAdmin({ id: "m12", medication_id: "med_001", child_id: "yp_casey", scheduled_time: "2026-05-22T21:30:00Z", actual_time: "2026-05-22T21:32:00Z", status: "given" }),
        makeAdmin({ id: "m13", medication_id: "med_001", child_id: "yp_casey", scheduled_time: "2026-05-23T21:30:00Z", actual_time: "2026-05-23T21:30:00Z", status: "given" }),
        makeAdmin({ id: "m14", medication_id: "med_001", child_id: "yp_casey", scheduled_time: "2026-05-24T21:30:00Z", actual_time: "2026-05-24T21:28:00Z", status: "given" }),
        // Alex Ibuprofen PRN — 2 uses
        makeAdmin({ id: "m20", medication_id: "med_003", child_id: "yp_alex", scheduled_time: "2026-05-18T16:00:00Z", actual_time: "2026-05-18T16:05:00Z", status: "given", prn_reason: "Headache", prn_effectiveness: "Effective" }),
        makeAdmin({ id: "m21", medication_id: "med_003", child_id: "yp_alex", scheduled_time: "2026-05-22T17:30:00Z", actual_time: "2026-05-22T17:35:00Z", status: "given", prn_reason: "Knee pain", prn_effectiveness: "Partially effective" }),
        // Jordan Piriton PRN — 1 use
        makeAdmin({ id: "m30", medication_id: "med_004", child_id: "yp_jordan", scheduled_time: "2026-05-15T14:00:00Z", actual_time: "2026-05-15T14:10:00Z", status: "given", prn_reason: "Rash", prn_effectiveness: "Effective" }),
      ];

      const result = computeMedicationIntelligence({ children, medications, administrations, today: TODAY });

      // Overview
      expect(result.overview.total_active_medications).toBe(4);
      expect(result.overview.total_administrations_30d).toBe(13);
      expect(result.overview.adherence_rate).toBe(100); // all given or late (counts)
      expect(result.overview.refusal_rate).toBe(0);
      expect(result.overview.missed_rate).toBe(0);
      expect(result.overview.prn_administrations_30d).toBe(3);
      expect(result.overview.stock_check_compliance).toBe(100); // all checked within 7d

      // Child profiles
      expect(result.child_profiles).toHaveLength(3);
      const casey = result.child_profiles.find((p) => p.child_name === "Casey")!;
      expect(casey.active_medications).toBe(2);
      expect(casey.administrations_30d).toBe(10);
      expect(casey.compliance_status).toBe("excellent");

      const alex = result.child_profiles.find((p) => p.child_name === "Alex")!;
      expect(alex.prn_uses_30d).toBe(2);

      // PRN analysis
      expect(result.prn_analysis.total_prn_30d).toBe(3);
      expect(result.prn_analysis.effectiveness_rate).toBe(100);

      // No alerts (good practice)
      const critical = result.alerts.filter((a) => a.severity === "critical");
      expect(critical).toHaveLength(0);

      // Positive insights should fire
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.length).toBeGreaterThanOrEqual(1);
    });
  });
});
