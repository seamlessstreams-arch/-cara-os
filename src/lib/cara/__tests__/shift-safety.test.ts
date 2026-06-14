import { describe, it, expect } from "vitest";
import { checkShiftSafety, type ShiftContext, type StaffMember, type ChildPresence } from "../shift-safety";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeStaff(overrides: Partial<StaffMember> = {}): StaffMember {
  return {
    id: "staff_1",
    name: "Test Staff",
    role: "senior",
    qualifications: ["medication", "restraint", "first_aid", "senior_on_duty"],
    hoursWorkedToday: 4,
    ...overrides,
  };
}

function makeChild(overrides: Partial<ChildPresence> = {}): ChildPresence {
  return {
    id: "child_1",
    name: "Test Child",
    riskLevel: "low",
    needsPresent: [],
    hasScheduledContact: false,
    behaviourSupportPlanActive: false,
    ...overrides,
  };
}

function makeContext(overrides: Partial<ShiftContext> = {}): ShiftContext {
  return {
    homeId: "home_oak",
    shiftType: "day",
    staffOnDuty: [makeStaff(), makeStaff({ id: "staff_2", name: "Staff 2", role: "residential" })],
    childrenPresent: [makeChild(), makeChild({ id: "child_2", name: "Child 2" })],
    scheduledEvents: [],
    lastHandoverComplete: true,
    lastFireDrill: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
    lastEnvironmentCheck: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
    medicationsToAdminister: [],
    openRisks: [],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Shift Safety Checker", () => {
  describe("checkShiftSafety", () => {
    it("returns safe when all checks pass", () => {
      const result = checkShiftSafety(makeContext());
      expect(result.overallRisk).toBe("safe");
      expect(result.signals.filter((s) => s.severity === "critical")).toHaveLength(0);
      expect(result.signals.filter((s) => s.severity === "high")).toHaveLength(0);
    });

    it("returns correct structure", () => {
      const result = checkShiftSafety(makeContext());
      expect(result.shiftType).toBe("day");
      expect(result.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(result.staffChildRatio).toBe("2:2");
      expect(result.compliance.met).toBeGreaterThan(0);
      expect(result.compliance.total).toBeGreaterThan(0);
      expect(result.summary).toBeTruthy();
    });
  });

  // ── Staffing ratio ────────────────────────────────────────────────────────

  describe("staffing", () => {
    it("flags critical when below minimum staff", () => {
      const ctx = makeContext({
        staffOnDuty: [makeStaff()], // 1 staff, min for day is 2
        childrenPresent: [makeChild(), makeChild({ id: "c2" }), makeChild({ id: "c3" })],
      });
      const result = checkShiftSafety(ctx);
      const critical = result.signals.find((s) => s.id === "staffing_below_minimum");
      expect(critical).toBeDefined();
      expect(critical!.severity).toBe("critical");
      expect(result.overallRisk).toBe("unsafe");
    });

    it("flags high when ratio is poor", () => {
      const ctx = makeContext({
        staffOnDuty: [makeStaff(), makeStaff({ id: "s2" })], // 2 staff
        childrenPresent: Array.from({ length: 5 }, (_, i) =>
          makeChild({ id: `c${i}`, name: `Child ${i}` })
        ), // 5 children → ratio 0.4 < 0.5
      });
      const result = checkShiftSafety(ctx);
      const ratioSignal = result.signals.find((s) => s.id === "staffing_ratio_low");
      expect(ratioSignal).toBeDefined();
      expect(ratioSignal!.severity).toBe("high");
    });

    it("passes when ratio is adequate", () => {
      const ctx = makeContext(); // 2:2 ratio = 1.0, well above 0.5
      const result = checkShiftSafety(ctx);
      const staffingIssues = result.signals.filter((s) => s.category === "staffing");
      expect(staffingIssues).toHaveLength(0);
    });
  });

  // ── Lone working ──────────────────────────────────────────────────────────

  describe("lone working", () => {
    it("flags critical for lone working with high-risk child", () => {
      const ctx = makeContext({
        staffOnDuty: [makeStaff()],
        childrenPresent: [makeChild({ riskLevel: "high", name: "Jordan" })],
        shiftType: "waking_night", // allows 1 staff
      });
      const result = checkShiftSafety(ctx);
      const signal = result.signals.find((s) => s.id === "lone_working_high_risk");
      expect(signal).toBeDefined();
      expect(signal!.severity).toBe("critical");
    });

    it("flags medium for lone working with low-risk children", () => {
      const ctx = makeContext({
        staffOnDuty: [makeStaff()],
        childrenPresent: [makeChild({ riskLevel: "low" })],
        shiftType: "waking_night",
      });
      const result = checkShiftSafety(ctx);
      const signal = result.signals.find((s) => s.id === "lone_working");
      expect(signal).toBeDefined();
      expect(signal!.severity).toBe("medium");
    });
  });

  // ── Medication ────────────────────────────────────────────────────────────

  describe("medication", () => {
    it("flags critical when no medication-trained staff", () => {
      const ctx = makeContext({
        staffOnDuty: [
          makeStaff({ qualifications: ["first_aid"] }),
          makeStaff({ id: "s2", qualifications: ["restraint"] }),
        ],
        medicationsToAdminister: [
          { childId: "c1", childName: "Child 1", medicationName: "Test Med", dueTime: "18:00", requiresTrainedStaff: true, isControlled: false },
        ],
      });
      const result = checkShiftSafety(ctx);
      const signal = result.signals.find((s) => s.id === "no_medication_trained");
      expect(signal).toBeDefined();
      expect(signal!.severity).toBe("critical");
    });

    it("flags controlled drug without two witnesses", () => {
      const ctx = makeContext({
        staffOnDuty: [
          makeStaff({ qualifications: ["medication", "first_aid"] }),
          makeStaff({ id: "s2", qualifications: ["first_aid"] }), // not med-trained
        ],
        medicationsToAdminister: [
          { childId: "c1", childName: "Child 1", medicationName: "Ritalin", dueTime: "08:00", requiresTrainedStaff: true, isControlled: true },
        ],
      });
      const result = checkShiftSafety(ctx);
      const signal = result.signals.find((s) => s.id === "controlled_drug_witness");
      expect(signal).toBeDefined();
      expect(signal!.severity).toBe("high");
    });

    it("passes when medication staff available", () => {
      const ctx = makeContext({
        medicationsToAdminister: [
          { childId: "c1", childName: "Child 1", medicationName: "Test", dueTime: "18:00", requiresTrainedStaff: true, isControlled: false },
        ],
      });
      const result = checkShiftSafety(ctx);
      const medIssues = result.signals.filter((s) => s.category === "medication");
      expect(medIssues).toHaveLength(0);
    });
  });

  // ── Qualifications ────────────────────────────────────────────────────────

  describe("qualifications", () => {
    it("flags no senior on shift", () => {
      const ctx = makeContext({
        staffOnDuty: [
          makeStaff({ role: "residential", qualifications: ["medication", "first_aid"] }),
          makeStaff({ id: "s2", role: "agency", qualifications: ["first_aid"] }),
        ],
      });
      const result = checkShiftSafety(ctx);
      const signal = result.signals.find((s) => s.id === "no_senior_cover");
      expect(signal).toBeDefined();
    });

    it("flags no restraint-trained staff with BSP children", () => {
      const ctx = makeContext({
        staffOnDuty: [
          makeStaff({ qualifications: ["medication", "first_aid", "senior_on_duty"] }),
          makeStaff({ id: "s2", qualifications: ["first_aid"] }),
        ],
        childrenPresent: [makeChild({ behaviourSupportPlanActive: true })],
      });
      const result = checkShiftSafety(ctx);
      const signal = result.signals.find((s) => s.id === "no_restraint_trained");
      expect(signal).toBeDefined();
      expect(signal!.severity).toBe("high");
    });

    it("flags no first aid trained staff", () => {
      const ctx = makeContext({
        staffOnDuty: [
          makeStaff({ qualifications: ["medication", "senior_on_duty", "restraint"] }),
          makeStaff({ id: "s2", qualifications: ["medication"] }),
        ],
      });
      const result = checkShiftSafety(ctx);
      const signal = result.signals.find((s) => s.id === "no_first_aid");
      expect(signal).toBeDefined();
    });
  });

  // ── Triggers ──────────────────────────────────────────────────────────────

  describe("triggers", () => {
    it("flags when family contact is a known trigger", () => {
      const ctx = makeContext({
        childrenPresent: [
          makeChild({ id: "child_j", name: "Jordan", knownTriggers: ["family contact", "transitions"] }),
        ],
        scheduledEvents: [
          { time: "15:00", type: "family_contact", childId: "child_j", description: "Call with mum" },
        ],
      });
      const result = checkShiftSafety(ctx);
      const signal = result.signals.find((s) => s.id === "trigger_contact_child_j");
      expect(signal).toBeDefined();
      expect(signal!.category).toBe("triggers");
    });

    it("does not flag contact when not a known trigger", () => {
      const ctx = makeContext({
        childrenPresent: [
          makeChild({ id: "child_s", name: "Sam", knownTriggers: ["bedtime"] }),
        ],
        scheduledEvents: [
          { time: "15:00", type: "family_contact", childId: "child_s", description: "Call with dad" },
        ],
      });
      const result = checkShiftSafety(ctx);
      const signal = result.signals.find((s) => s.category === "triggers");
      expect(signal).toBeUndefined();
    });
  });

  // ── Handover ──────────────────────────────────────────────────────────────

  describe("handover", () => {
    it("flags incomplete handover", () => {
      const ctx = makeContext({ lastHandoverComplete: false });
      const result = checkShiftSafety(ctx);
      const signal = result.signals.find((s) => s.id === "handover_incomplete");
      expect(signal).toBeDefined();
    });

    it("passes when handover complete", () => {
      const ctx = makeContext({ lastHandoverComplete: true });
      const result = checkShiftSafety(ctx);
      const signal = result.signals.find((s) => s.id === "handover_incomplete");
      expect(signal).toBeUndefined();
    });
  });

  // ── Emergency preparedness ────────────────────────────────────────────────

  describe("emergency", () => {
    it("flags overdue fire drill", () => {
      const ctx = makeContext({
        lastFireDrill: new Date(Date.now() - 35 * 86400000).toISOString().slice(0, 10),
      });
      const result = checkShiftSafety(ctx);
      const signal = result.signals.find((s) => s.id === "fire_drill_overdue");
      expect(signal).toBeDefined();
    });

    it("passes when fire drill recent", () => {
      const ctx = makeContext({
        lastFireDrill: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
      });
      const result = checkShiftSafety(ctx);
      const signal = result.signals.find((s) => s.id === "fire_drill_overdue");
      expect(signal).toBeUndefined();
    });

    it("flags no fire drill record", () => {
      const ctx = makeContext({ lastFireDrill: undefined });
      const result = checkShiftSafety(ctx);
      const signal = result.signals.find((s) => s.id === "fire_drill_no_record");
      expect(signal).toBeDefined();
      expect(signal!.severity).toBe("high");
    });
  });

  // ── Workload ──────────────────────────────────────────────────────────────

  describe("workload", () => {
    it("flags staff fatigue", () => {
      const ctx = makeContext({
        staffOnDuty: [
          makeStaff({ hoursWorkedToday: 11 }),
          makeStaff({ id: "s2", hoursWorkedToday: 4 }),
        ],
      });
      const result = checkShiftSafety(ctx);
      const signal = result.signals.find((s) => s.id === "staff_fatigue");
      expect(signal).toBeDefined();
    });

    it("flags insufficient staff for 1:1 needs", () => {
      const ctx = makeContext({
        staffOnDuty: [makeStaff(), makeStaff({ id: "s2" })],
        childrenPresent: [
          makeChild({ id: "c1", needsPresent: ["1:1"] }),
          makeChild({ id: "c2", needsPresent: ["1:1"] }),
          makeChild({ id: "c3" }),
        ],
      });
      const result = checkShiftSafety(ctx);
      const signal = result.signals.find((s) => s.id === "insufficient_for_1to1");
      expect(signal).toBeDefined();
      expect(signal!.severity).toBe("high");
    });
  });

  // ── Overall risk classification ───────────────────────────────────────────

  describe("overall risk", () => {
    it("unsafe when critical signals present", () => {
      const ctx = makeContext({
        staffOnDuty: [makeStaff({ qualifications: [] })], // lone + no quals
        childrenPresent: [makeChild({ riskLevel: "high" })],
        shiftType: "waking_night",
        medicationsToAdminister: [
          { childId: "c1", childName: "C1", medicationName: "Med", dueTime: "20:00", requiresTrainedStaff: true, isControlled: false },
        ],
      });
      const result = checkShiftSafety(ctx);
      expect(result.overallRisk).toBe("unsafe");
    });

    it("concerns when high signals but no critical", () => {
      const ctx = makeContext({
        staffOnDuty: [
          makeStaff({ qualifications: ["medication", "first_aid", "senior_on_duty"] }),
          makeStaff({ id: "s2", qualifications: ["medication", "first_aid"] }),
        ],
        childrenPresent: Array.from({ length: 5 }, (_, i) =>
          makeChild({ id: `c${i}`, name: `Child ${i}` })
        ),
      });
      const result = checkShiftSafety(ctx);
      expect(result.overallRisk).toBe("concerns");
    });

    it("safe when no critical or high signals", () => {
      const result = checkShiftSafety(makeContext());
      expect(result.overallRisk).toBe("safe");
    });
  });

  // ── Signal structure ──────────────────────────────────────────────────────

  describe("signal structure", () => {
    it("all signals have required fields", () => {
      const ctx = makeContext({
        staffOnDuty: [makeStaff({ qualifications: [] })],
        lastHandoverComplete: false,
        lastFireDrill: undefined,
      });
      const result = checkShiftSafety(ctx);

      for (const signal of result.signals) {
        expect(signal.id).toBeTruthy();
        expect(["critical", "high", "medium", "advisory"]).toContain(signal.severity);
        expect(signal.category).toBeTruthy();
        expect(signal.title).toBeTruthy();
        expect(signal.description).toBeTruthy();
        expect(signal.action).toBeTruthy();
      }
    });

    it("signals are sorted by severity (critical first)", () => {
      const ctx = makeContext({
        staffOnDuty: [makeStaff({ qualifications: [] })],
        childrenPresent: [makeChild({ riskLevel: "high" })],
        shiftType: "waking_night",
        lastHandoverComplete: false,
        medicationsToAdminister: [
          { childId: "c1", childName: "C1", medicationName: "Med", dueTime: "20:00", requiresTrainedStaff: true, isControlled: false },
        ],
      });
      const result = checkShiftSafety(ctx);

      if (result.signals.length >= 2) {
        const severities = result.signals.map((s) => s.severity);
        const order = ["critical", "high", "medium", "advisory"];
        for (let i = 1; i < severities.length; i++) {
          expect(order.indexOf(severities[i])).toBeGreaterThanOrEqual(order.indexOf(severities[i - 1]));
        }
      }
    });
  });
});
