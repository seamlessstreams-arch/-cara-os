// ══════════════════════════════════════════════════════════════════════════════
// Tests — a medication nobody signed off is not a medication given correctly
//
// All eighteen health judgements defaulted to `true` in the read path. The
// sharpest was per-medication:
//
//   administeredCorrectly: m.administered_correctly ?? true,
//
// which fed CHR 2015 Reg 23, reporting "Medication managed safely with
// appropriate consent" for a medication whose administration nobody had
// recorded, and the strength "All medications managed correctly with consent".
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  analyseHealth,
  type HealthInput,
  type Medication,
  type HealthAppointment,
} from "../health-intelligence";

function med(administeredCorrectly: boolean | null, name = "Sertraline"): Medication {
  return { name, prescribed: true, administeredCorrectly, consentInPlace: true, reviewDue: false };
}

function input(overrides: Partial<HealthInput> = {}): HealthInput {
  return {
    childId: "child_1",
    childName: "Jordan",
    age: 15,
    healthAssessments: [],
    assessmentOverdue: false,
    gpRegistered: null,
    dentistRegistered: null,
    opticiansRegistered: null,
    dentalCheckLast6Months: null,
    opticalCheckLast12Months: null,
    immunisations: [],
    immunisationsUpToDate: true,
    appointments: [],
    medications: [],
    healthActionPlanInPlace: null,
    healthActionPlanReviewed: null,
    actionsTotal: 0,
    actionsCompleted: 0,
    substanceMisuseIdentified: false,
    substanceMisuseSupport: false,
    healthyEatingSupported: null,
    physicalActivityRegular: null,
    sleepRoutineGood: null,
    staffHealthTrained: null,
    childUnderstandsHealth: null,
    consentFormsComplete: null,
    healthPassportUpToDate: null,
    ...overrides,
  };
}

const reg23 = (a: ReturnType<typeof analyseHealth>) =>
  a.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 23");

describe("an unrecorded medication administration", () => {
  const unrecorded = input({ medications: [med(null)] });

  it("does not report Reg 23 as met", () => {
    expect(reg23(analyseHealth(unrecorded))?.status).toBe("not_evidenced");
    expect(reg23(analyseHealth(unrecorded))?.detail).toMatch(/no record/i);
  });

  it("does not claim all medications were managed correctly", () => {
    const { strengths } = analyseHealth(unrecorded);
    expect(strengths.some(s => s.description === "All medications managed correctly with consent")).toBe(false);
  });

  it("does not report it as a medication error either", () => {
    const { concerns } = analyseHealth(unrecorded);
    expect(concerns.some(c => /incorrectly administered|medication error/i.test(c.description))).toBe(false);
  });

  it("still reports Reg 23 met when administration was recorded", () => {
    expect(reg23(analyseHealth(input({ medications: [med(true)] })))?.status).toBe("met");
  });

  it("still reports a breach when administration was recorded as incorrect", () => {
    expect(reg23(analyseHealth(input({ medications: [med(false)] })))?.status).not.toBe("met");
    expect(reg23(analyseHealth(input({ medications: [med(false)] })))?.status).not.toBe("not_evidenced");
  });
});

describe("unrecorded registrations and checks", () => {
  it("does not claim the child is registered with a GP", () => {
    const registered = analyseHealth(input({ gpRegistered: true }));
    const unrecorded = analyseHealth(input({ gpRegistered: null }));
    expect(unrecorded.registrationScore).toBeLessThan(registered.registrationScore);
  });

  it("does not assert an unregistered GP as a critical concern", () => {
    const { concerns, recommendations } = analyseHealth(input({ gpRegistered: null }));
    expect(concerns.some(c => c.severity === "critical" && /GP/i.test(c.description))).toBe(false);
    expect(recommendations).not.toContain("URGENT: Register with GP immediately");
  });

  it("still asserts it when the absence was recorded", () => {
    const { concerns, recommendations } = analyseHealth(input({ gpRegistered: false }));
    expect(concerns.some(c => c.severity === "critical" && /GP/i.test(c.description))).toBe(true);
    expect(recommendations).toContain("URGENT: Register with GP immediately");
  });

  it("claims no registration strength it cannot evidence", () => {
    const { strengths } = analyseHealth(input());
    expect(strengths.some(s => /registered/i.test(s.description))).toBe(false);
  });
});

describe("appointment attendance counts what was recorded", () => {
  const appt = (attended: boolean | null, date: string): HealthAppointment =>
    ({ date, type: "gp", attended });

  it("excludes an appointment with no recorded attendance from the rate entirely", () => {
    // The first draft of this test asserted the unrecorded appointment should
    // LOWER the rate. That was wrong in the same way the original `?? true` was
    // wrong, just pointed the other way: leaving it out of the numerator but
    // keeping it in the denominator turns silence into a missed appointment.
    const oneUnrecorded = analyseHealth(input({
      appointments: [appt(null, "2026-05-01"), appt(true, "2026-05-02")],
    }));
    const bothAttended = analyseHealth(input({
      appointments: [appt(true, "2026-05-01"), appt(true, "2026-05-02")],
    }));
    expect(oneUnrecorded.appointmentAttendanceRate).toBe(bothAttended.appointmentAttendanceRate);
  });

  it("still counts a recorded non-attendance against the rate", () => {
    const oneMissed = analyseHealth(input({
      appointments: [appt(false, "2026-05-01"), appt(true, "2026-05-02")],
    }));
    const bothAttended = analyseHealth(input({
      appointments: [appt(true, "2026-05-01"), appt(true, "2026-05-02")],
    }));
    expect(oneMissed.appointmentAttendanceRate).toBeLessThan(bothAttended.appointmentAttendanceRate);
  });
});
