// ══════════════════════════════════════════════════════════════════════════════
// Tests — a late assessment is not a met one, and an unrecorded GP is not a GP
//
// Two defects in the statutory health surface:
//
//   status: input.ihaWithin20Days ? "met" : "met",  // done but possibly late
//
// Both arms read "met", so an Initial Health Assessment completed outside its
// 20-working-day statutory window reported as fully compliant and scored the
// full 25 points. And `registeredWithGP` defaulted to `true` in the read path,
// so a child with no health record read as registered with a GP.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { analyseHealthAppointments, type HealthInput } from "../health-appointments-intelligence";

function input(overrides: Partial<HealthInput> = {}): HealthInput {
  return {
    childId: "child_1",
    childName: "Jordan",
    age: 15,
    dateEnteredCare: "2026-01-10",
    hasIHA: true,
    ihaDate: "2026-01-20",
    ihaWithin20Days: true,
    immunisationsUpToDate: true,
    appointments: [],
    registeredWithGP: true,
    registeredWithDentist: true,
    hasHealthPlan: true,
    healthPlanUpToDate: true,
    consentFormsComplete: true,
    ...overrides,
  };
}

const ihaCheck = (a: ReturnType<typeof analyseHealthAppointments>) =>
  a.statutoryChecks.find(c => c.type === "IHA");

describe("an IHA done outside its statutory window", () => {
  it("is reported as late, not met", () => {
    expect(ihaCheck(analyseHealthAppointments(input({ ihaWithin20Days: false })))?.status).toBe("late");
    expect(ihaCheck(analyseHealthAppointments(input({ ihaWithin20Days: true })))?.status).toBe("met");
  });

  it("does not earn the full statutory-compliance weighting", () => {
    const late = analyseHealthAppointments(input({ ihaWithin20Days: false }));
    const onTime = analyseHealthAppointments(input({ ihaWithin20Days: true }));
    expect(late.statutoryComplianceScore).toBeLessThan(onTime.statutoryComplianceScore);
  });

  it("is not claimed as 'all assessments up to date'", () => {
    const { strengths } = analyseHealthAppointments(input({ ihaWithin20Days: false }));
    expect(strengths.some(s => s.description === "All statutory health assessments up to date")).toBe(false);
  });
});

describe("an unrecorded GP registration", () => {
  it("is not scored as registered", () => {
    const unrecorded = analyseHealthAppointments(input({ registeredWithGP: null }));
    const registered = analyseHealthAppointments(input({ registeredWithGP: true }));
    expect(unrecorded.coverageScore).toBeLessThan(registered.coverageScore);
  });

  it("is raised as a recording gap, not as a critical breach", () => {
    const { concerns } = analyseHealthAppointments(input({ registeredWithGP: null }));
    expect(concerns.some(c => /not recorded/i.test(c.description))).toBe(true);
    expect(concerns.some(c => c.description.startsWith("Not registered with a GP"))).toBe(false);
  });

  it("still raises the critical breach when it was recorded as absent", () => {
    const { concerns } = analyseHealthAppointments(input({ registeredWithGP: false }));
    const gp = concerns.find(c => c.description.startsWith("Not registered with a GP"));
    expect(gp?.severity).toBe("critical");
  });
});
