import { describe, it, expect } from "vitest";
import {
  analyseMedications,
  type MedicationRecord,
  type MedicationProfile,
} from "../medication-intelligence";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeDate(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
}

function makeRecord(overrides: Partial<MedicationRecord> = {}): MedicationRecord {
  return {
    id: `med_${Math.random().toString(36).slice(2, 8)}`,
    childId: "child_1",
    childName: "Test Child",
    medicationName: "Methylphenidate",
    dose: "10mg",
    route: "oral",
    type: "regular",
    scheduledTime: "08:00",
    administeredTime: "08:05",
    administeredDate: makeDate(1),
    status: "given",
    administeredBy: "staff_1",
    ...overrides,
  };
}

function makeControlledRecord(overrides: Partial<MedicationRecord> = {}): MedicationRecord {
  return makeRecord({
    type: "controlled",
    medicationName: "Methylphenidate",
    witnessedBy: "staff_2",
    ...overrides,
  });
}

function makePRNRecord(overrides: Partial<MedicationRecord> = {}): MedicationRecord {
  return makeRecord({
    type: "prn",
    medicationName: "Ibuprofen",
    scheduledTime: "",
    ...overrides,
  });
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Medication Intelligence", () => {
  describe("analyseMedications — basic structure", () => {
    it("returns correct structure with empty records", () => {
      const result = analyseMedications([], [], "home_oak", 7);
      expect(result.homeId).toBe("home_oak");
      expect(result.windowDays).toBe(7);
      expect(result.totalAdministrations).toBe(0);
      expect(result.complianceRate).toBe(100);
      expect(result.missedDoses).toBe(0);
      expect(result.refusals).toBe(0);
      expect(result.lateAdministrations).toBe(0);
      expect(result.childSummaries).toHaveLength(0);
      expect(result.alerts).toHaveLength(0);
      expect(result.prnAnalysis).toHaveLength(0);
      expect(result.patterns).toHaveLength(0);
      expect(result.regulatoryStatus.compliant).toBe(true);
    });

    it("counts total administrations", () => {
      const records = [
        makeRecord({ status: "given" }),
        makeRecord({ status: "given" }),
        makeRecord({ status: "missed" }),
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      expect(result.totalAdministrations).toBe(3);
    });

    it("sets analysis date to today", () => {
      const today = new Date().toISOString().slice(0, 10);
      const result = analyseMedications([], [], "home_oak", 7);
      expect(result.analysisDate).toBe(today);
    });
  });

  // ── Compliance ────────────────────────────────────────────────────────────

  describe("compliance calculation", () => {
    it("100% compliance when all given on time", () => {
      const records = [
        makeRecord({ scheduledTime: "08:00", administeredTime: "08:10", status: "given" }),
        makeRecord({ scheduledTime: "12:00", administeredTime: "12:05", status: "given" }),
        makeRecord({ scheduledTime: "18:00", administeredTime: "18:15", status: "given" }),
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      expect(result.complianceRate).toBe(100);
    });

    it("calculates compliance excluding late and missed doses", () => {
      const records = [
        makeRecord({ scheduledTime: "08:00", administeredTime: "08:10", status: "given" }),
        makeRecord({ scheduledTime: "12:00", administeredTime: "12:05", status: "given" }),
        makeRecord({ scheduledTime: "18:00", administeredTime: "19:00", status: "given" }), // late (60min)
        makeRecord({ status: "missed" }),
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      // 2 on-time out of 4 total = 50%
      expect(result.complianceRate).toBe(50);
    });

    it("counts late administrations (>30 min)", () => {
      const records = [
        makeRecord({ scheduledTime: "08:00", administeredTime: "08:25", status: "given" }), // on time
        makeRecord({ scheduledTime: "08:00", administeredTime: "08:35", status: "given" }), // late (35 min)
        makeRecord({ scheduledTime: "08:00", administeredTime: "09:15", status: "given" }), // late (75 min)
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      expect(result.lateAdministrations).toBe(2);
    });

    it("counts missed doses", () => {
      const records = [
        makeRecord({ status: "given" }),
        makeRecord({ status: "missed" }),
        makeRecord({ status: "missed" }),
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      expect(result.missedDoses).toBe(2);
    });

    it("counts refusals", () => {
      const records = [
        makeRecord({ status: "given" }),
        makeRecord({ status: "refused", refusalReason: "Doesn't want it" }),
        makeRecord({ status: "refused", refusalReason: "Feels sick" }),
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      expect(result.refusals).toBe(2);
    });
  });

  // ── Child summaries ───────────────────────────────────────────────────────

  describe("child summaries", () => {
    it("generates per-child summaries", () => {
      const records = [
        makeRecord({ childId: "child_1", childName: "Jordan", status: "given" }),
        makeRecord({ childId: "child_1", childName: "Jordan", status: "missed" }),
        makeRecord({ childId: "child_2", childName: "Sam", status: "given" }),
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      expect(result.childSummaries).toHaveLength(2);
    });

    it("calculates per-child compliance", () => {
      const records = [
        makeRecord({ childId: "child_1", childName: "Jordan", scheduledTime: "08:00", administeredTime: "08:10", status: "given" }),
        makeRecord({ childId: "child_1", childName: "Jordan", status: "missed" }),
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      const jordan = result.childSummaries.find((s) => s.childId === "child_1");
      expect(jordan).toBeDefined();
      expect(jordan!.totalDoses).toBe(2);
      expect(jordan!.missed).toBe(1);
      expect(jordan!.compliancePercent).toBe(50);
    });

    it("calculates refusal rate", () => {
      const records = [
        makeRecord({ childId: "child_1", status: "given" }),
        makeRecord({ childId: "child_1", status: "refused" }),
        makeRecord({ childId: "child_1", status: "refused" }),
        makeRecord({ childId: "child_1", status: "given" }),
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      const child = result.childSummaries[0];
      expect(child.refusalRate).toBe(50);
    });

    it("identifies most refused medication", () => {
      const records = [
        makeRecord({ childId: "child_1", medicationName: "Med A", status: "refused" }),
        makeRecord({ childId: "child_1", medicationName: "Med A", status: "refused" }),
        makeRecord({ childId: "child_1", medicationName: "Med B", status: "refused" }),
        makeRecord({ childId: "child_1", medicationName: "Med A", status: "given" }),
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      const child = result.childSummaries[0];
      expect(child.mostRefusedMedication).toBe("Med A");
    });
  });

  // ── Alerts ────────────────────────────────────────────────────────────────

  describe("alerts", () => {
    it("generates critical alert for 3+ missed doses per child", () => {
      const records = [
        makeRecord({ childId: "child_1", childName: "Jordan", status: "missed", administeredDate: makeDate(1) }),
        makeRecord({ childId: "child_1", childName: "Jordan", status: "missed", administeredDate: makeDate(2) }),
        makeRecord({ childId: "child_1", childName: "Jordan", status: "missed", administeredDate: makeDate(3) }),
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      const critical = result.alerts.find((a) => a.severity === "critical" && a.category === "missed");
      expect(critical).toBeDefined();
      expect(critical!.title).toContain("3 missed doses");
    });

    it("generates high alert for 1-2 missed doses", () => {
      const records = [
        makeRecord({ childId: "child_1", childName: "Jordan", status: "missed" }),
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      const high = result.alerts.find((a) => a.severity === "high" && a.category === "missed");
      expect(high).toBeDefined();
    });

    it("generates refusal alert for 3+ refusals", () => {
      const records = [
        makeRecord({ childId: "child_1", childName: "Jordan", status: "refused" }),
        makeRecord({ childId: "child_1", childName: "Jordan", status: "refused" }),
        makeRecord({ childId: "child_1", childName: "Jordan", status: "refused" }),
        makeRecord({ childId: "child_1", childName: "Jordan", status: "given" }),
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      const refusalAlert = result.alerts.find((a) => a.category === "refusal");
      expect(refusalAlert).toBeDefined();
      expect(refusalAlert!.severity).toBe("high");
    });

    it("no refusal alert for fewer than 3 refusals", () => {
      const records = [
        makeRecord({ childId: "child_1", status: "refused" }),
        makeRecord({ childId: "child_1", status: "refused" }),
        makeRecord({ childId: "child_1", status: "given" }),
        makeRecord({ childId: "child_1", status: "given" }),
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      const refusalAlert = result.alerts.find((a) => a.category === "refusal");
      expect(refusalAlert).toBeUndefined();
    });

    it("alerts are sorted by severity (critical first)", () => {
      const records = [
        makeRecord({ childId: "child_1", childName: "Jordan", status: "missed" }),
        makeRecord({ childId: "child_1", childName: "Jordan", status: "missed" }),
        makeRecord({ childId: "child_1", childName: "Jordan", status: "missed" }),
        makeControlledRecord({ childId: "child_2", childName: "Sam", witnessedBy: undefined, status: "given" }),
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      expect(result.alerts.length).toBeGreaterThanOrEqual(2);
      expect(result.alerts[0].severity).toBe("critical");
    });
  });

  // ── PRN Analysis ──────────────────────────────────────────────────────────

  describe("PRN analysis", () => {
    it("tracks PRN usage count per medication per child", () => {
      const records = [
        makePRNRecord({ childId: "child_1", childName: "Jordan", medicationName: "Ibuprofen", administeredDate: makeDate(1) }),
        makePRNRecord({ childId: "child_1", childName: "Jordan", medicationName: "Ibuprofen", administeredDate: makeDate(3) }),
        makePRNRecord({ childId: "child_1", childName: "Jordan", medicationName: "Ibuprofen", administeredDate: makeDate(5) }),
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      expect(result.prnAnalysis).toHaveLength(1);
      expect(result.prnAnalysis[0].usageCount).toBe(3);
      expect(result.prnAnalysis[0].medicationName).toBe("Ibuprofen");
    });

    it("calculates average time between PRN doses", () => {
      const records = [
        makePRNRecord({ childId: "child_1", administeredDate: makeDate(6) }),
        makePRNRecord({ childId: "child_1", administeredDate: makeDate(4) }),
        makePRNRecord({ childId: "child_1", administeredDate: makeDate(2) }),
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      expect(result.prnAnalysis[0].averageTimeBetween).toBe(48); // 2 days = 48 hours
    });

    it("detects increasing PRN trend", () => {
      // First half: 1 use, Second half: 3 uses (3 > 1 * 1.5)
      const records = [
        makePRNRecord({ childId: "child_1", administeredDate: makeDate(7) }),
        makePRNRecord({ childId: "child_1", administeredDate: makeDate(3) }),
        makePRNRecord({ childId: "child_1", administeredDate: makeDate(2) }),
        makePRNRecord({ childId: "child_1", administeredDate: makeDate(1) }),
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      expect(result.prnAnalysis[0].trend).toBe("increasing");
      expect(result.prnAnalysis[0].concern).toBeDefined();
    });

    it("generates alert for PRN escalation", () => {
      const records = [
        makePRNRecord({ childId: "child_1", childName: "Jordan", administeredDate: makeDate(7) }),
        makePRNRecord({ childId: "child_1", childName: "Jordan", administeredDate: makeDate(3) }),
        makePRNRecord({ childId: "child_1", childName: "Jordan", administeredDate: makeDate(2) }),
        makePRNRecord({ childId: "child_1", childName: "Jordan", administeredDate: makeDate(1) }),
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      const prnAlert = result.alerts.find((a) => a.category === "pattern");
      expect(prnAlert).toBeDefined();
      expect(prnAlert!.title).toContain("PRN escalation");
    });

    it("stable trend when usage consistent", () => {
      const records = [
        makePRNRecord({ childId: "child_1", administeredDate: makeDate(8) }),
        makePRNRecord({ childId: "child_1", administeredDate: makeDate(6) }),
        makePRNRecord({ childId: "child_1", administeredDate: makeDate(4) }),
        makePRNRecord({ childId: "child_1", administeredDate: makeDate(2) }),
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      expect(result.prnAnalysis[0].trend).toBe("stable");
    });
  });

  // ── Controlled Drug Audit ─────────────────────────────────────────────────

  describe("controlled drug audit", () => {
    it("tracks witness compliance for controlled drugs", () => {
      const records = [
        makeControlledRecord({ witnessedBy: "staff_2", status: "given" }),
        makeControlledRecord({ witnessedBy: "staff_3", status: "given" }),
        makeControlledRecord({ witnessedBy: undefined, status: "given" }),
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      expect(result.controlledDrugAudit.totalAdministrations).toBe(3);
      expect(result.controlledDrugAudit.withWitness).toBe(2);
      expect(result.controlledDrugAudit.withoutWitness).toBe(1);
      expect(result.controlledDrugAudit.witnessCompliancePercent).toBe(67);
    });

    it("100% witness compliance when all witnessed", () => {
      const records = [
        makeControlledRecord({ witnessedBy: "staff_2", status: "given" }),
        makeControlledRecord({ witnessedBy: "staff_3", status: "given" }),
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      expect(result.controlledDrugAudit.witnessCompliancePercent).toBe(100);
    });

    it("generates critical alert for unwitnessed controlled drugs", () => {
      const records = [
        makeControlledRecord({ witnessedBy: undefined, status: "given" }),
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      const critical = result.alerts.find((a) => a.severity === "critical" && a.category === "controlled");
      expect(critical).toBeDefined();
      expect(critical!.regulation).toContain("Misuse of Drugs");
    });

    it("no alert when all controlled drugs properly witnessed", () => {
      const records = [
        makeControlledRecord({ witnessedBy: "staff_2", status: "given" }),
        makeControlledRecord({ witnessedBy: "staff_3", status: "given" }),
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      const controlledAlert = result.alerts.find((a) => a.category === "controlled");
      expect(controlledAlert).toBeUndefined();
    });
  });

  // ── Patterns ──────────────────────────────────────────────────────────────

  describe("patterns", () => {
    it("detects time drift pattern", () => {
      const records = Array.from({ length: 8 }, (_, i) =>
        makeRecord({
          scheduledTime: "08:00",
          administeredTime: `08:${String(25 + i).padStart(2, "0")}`, // 25-32 minutes late
          status: "given",
          administeredDate: makeDate(i),
        })
      );
      const result = analyseMedications(records, [], "home_oak", 7);
      const drift = result.patterns.find((p) => p.type === "time_drift");
      expect(drift).toBeDefined();
      expect(drift!.significance).toBe("medium");
    });

    it("detects frequent refusal pattern", () => {
      const records = [
        makeRecord({ childId: "child_1", childName: "Jordan", status: "refused" }),
        makeRecord({ childId: "child_1", childName: "Jordan", status: "refused" }),
        makeRecord({ childId: "child_1", childName: "Jordan", status: "refused" }),
        makeRecord({ childId: "child_1", childName: "Jordan", status: "given" }),
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      const refusal = result.patterns.find((p) => p.type === "frequent_refusal");
      expect(refusal).toBeDefined();
      expect(refusal!.significance).toBe("high");
    });

    it("detects PRN escalation pattern", () => {
      const records = [
        makePRNRecord({ childId: "child_1", childName: "Jordan", administeredDate: makeDate(7) }),
        makePRNRecord({ childId: "child_1", childName: "Jordan", administeredDate: makeDate(3) }),
        makePRNRecord({ childId: "child_1", childName: "Jordan", administeredDate: makeDate(2) }),
        makePRNRecord({ childId: "child_1", childName: "Jordan", administeredDate: makeDate(1) }),
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      const escalation = result.patterns.find((p) => p.type === "prn_escalation");
      expect(escalation).toBeDefined();
    });
  });

  // ── Regulatory Status ─────────────────────────────────────────────────────

  describe("regulatory status", () => {
    it("compliant when no issues", () => {
      const records = [
        makeRecord({ scheduledTime: "08:00", administeredTime: "08:10", status: "given" }),
        makeRecord({ scheduledTime: "12:00", administeredTime: "12:05", status: "given" }),
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      expect(result.regulatoryStatus.compliant).toBe(true);
      expect(result.regulatoryStatus.issues).toHaveLength(0);
    });

    it("non-compliant when missed doses exist", () => {
      const records = [
        makeRecord({ status: "missed" }),
        makeRecord({ status: "given" }),
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      expect(result.regulatoryStatus.compliant).toBe(false);
      expect(result.regulatoryStatus.issues.some((i) => i.includes("missed"))).toBe(true);
    });

    it("non-compliant when controlled drug witness gap", () => {
      const records = [
        makeControlledRecord({ witnessedBy: undefined, status: "given" }),
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      expect(result.regulatoryStatus.compliant).toBe(false);
      expect(result.regulatoryStatus.issues.some((i) => i.includes("witness"))).toBe(true);
    });

    it("non-compliant when compliance below 90%", () => {
      const records = [
        makeRecord({ scheduledTime: "08:00", administeredTime: "08:10", status: "given" }),
        makeRecord({ status: "missed" }),
        makeRecord({ status: "missed" }),
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      expect(result.regulatoryStatus.compliant).toBe(false);
      expect(result.regulatoryStatus.issues.some((i) => i.includes("Compliance rate below 90%"))).toBe(true);
    });

    it("records strengths for excellent compliance", () => {
      const records = Array.from({ length: 20 }, () =>
        makeRecord({ scheduledTime: "08:00", administeredTime: "08:05", status: "given" })
      );
      const result = analyseMedications(records, [], "home_oak", 7);
      expect(result.regulatoryStatus.strengths.some((s) => s.includes("Excellent"))).toBe(true);
    });

    it("records strength for properly witnessed controlled drugs", () => {
      const records = [
        makeControlledRecord({ witnessedBy: "staff_2", status: "given" }),
        makeControlledRecord({ witnessedBy: "staff_3", status: "given" }),
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      expect(result.regulatoryStatus.strengths.some((s) => s.includes("witnessed"))).toBe(true);
    });

    it("records strength for no missed doses", () => {
      const records = [
        makeRecord({ status: "given" }),
        makeRecord({ status: "given" }),
      ];
      const result = analyseMedications(records, [], "home_oak", 7);
      expect(result.regulatoryStatus.strengths.some((s) => s.includes("No missed"))).toBe(true);
    });
  });
});
