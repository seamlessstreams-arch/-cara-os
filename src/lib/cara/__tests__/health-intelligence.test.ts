// ══════════════════════════════════════════════════════════════════════════════
// Tests — Cara Health Intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  analyseHealth,
  type HealthInput,
  type HealthAssessment,
  type Immunisation,
  type HealthAppointment,
  type Medication,
} from "../health-intelligence";

const FIXED_NOW = "2026-05-16T12:00:00Z";

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(FIXED_NOW)); });
afterEach(() => { vi.useRealTimers(); });

// ── Helpers ────────────────────────────────────────────────────────────────

function makeInput(overrides: Partial<HealthInput> = {}): HealthInput {
  return {
    childId: "child_1",
    childName: "Jordan",
    age: 15,
    healthAssessments: [
      { date: "2026-03-01", type: "review", completedOnTime: true, actionPlanCreated: true },
    ],
    lastAssessmentDate: "2026-03-01",
    nextAssessmentDue: "2027-03-01",
    assessmentOverdue: false,
    gpRegistered: true,
    dentistRegistered: true,
    opticiansRegistered: true,
    dentalCheckLast6Months: true,
    opticalCheckLast12Months: true,
    lastDentalDate: "2026-02-15",
    lastOpticalDate: "2025-11-10",
    immunisations: [
      { name: "MMR", due: false, overdue: false, dateGiven: "2020-01-01" },
      { name: "Td/IPV", due: false, overdue: false, dateGiven: "2024-09-01" },
      { name: "MenACWY", due: false, overdue: false, dateGiven: "2024-09-01" },
    ],
    immunisationsUpToDate: true,
    appointments: [
      { date: "2026-03-10", type: "gp", attended: true },
      { date: "2026-04-05", type: "dental", attended: true },
      { date: "2026-04-20", type: "specialist", attended: true },
    ],
    medications: [],
    healthActionPlanInPlace: true,
    healthActionPlanReviewed: true,
    actionsTotal: 4,
    actionsCompleted: 3,
    substanceMisuseIdentified: false,
    substanceMisuseSupport: false,
    healthyEatingSupported: true,
    physicalActivityRegular: true,
    sleepRoutineGood: true,
    staffHealthTrained: true,
    childUnderstandsHealth: true,
    consentFormsComplete: true,
    healthPassportUpToDate: true,
    ...overrides,
  };
}

// ── Overall Structure ──────────────────────────────────────────────────────

describe("analyseHealth — immunisation status is never fabricated from no data", () => {
  it("reports immunisationRate as null, not 100%, when no immunisations are on record", () => {
    const result = analyseHealth(makeInput({ immunisations: [] }));
    // "no data" must NOT read as "up to date" — an unvaccinated child with an
    // empty register is a health gap, not a child in full compliance.
    expect(result.immunisationRate).toBeNull();
  });

  it("does not award an 'up to date' strength when immunisations are unrecorded", () => {
    const result = analyseHealth(makeInput({ immunisations: [] }));
    expect(result.strengths.some((s) => /immunisation/i.test(s.description) && /up to date/i.test(s.description))).toBe(false);
  });

  it("raises a concern that immunisation status cannot be evidenced when unrecorded", () => {
    const result = analyseHealth(makeInput({ immunisations: [] }));
    expect(result.concerns.some((c) => c.category === "immunisation")).toBe(true);
    expect(result.summary).toMatch(/immunisation status not recorded/i);
  });

  it("still credits immunisations that ARE recorded and current", () => {
    const result = analyseHealth(makeInput());
    expect(result.immunisationRate).toBe(1);
    expect(result.summary).toMatch(/immunisations up to date/i);
  });
});

describe("analyseHealth", () => {
  it("returns all required fields", () => {
    const result = analyseHealth(makeInput());
    expect(result).toHaveProperty("childName");
    expect(result).toHaveProperty("overallScore");
    expect(result).toHaveProperty("overallRating");
    expect(result).toHaveProperty("assessmentScore");
    expect(result).toHaveProperty("registrationScore");
    expect(result).toHaveProperty("appointmentScore");
    expect(result).toHaveProperty("lifestyleScore");
    expect(result).toHaveProperty("assessmentStatus");
    expect(result).toHaveProperty("immunisationRate");
    expect(result).toHaveProperty("appointmentAttendanceRate");
    expect(result).toHaveProperty("medicationCompliance");
    expect(result).toHaveProperty("healthActionProgress");
    expect(result).toHaveProperty("concerns");
    expect(result).toHaveProperty("strengths");
    expect(result).toHaveProperty("regulatoryFlags");
    expect(result).toHaveProperty("recommendations");
    expect(result).toHaveProperty("summary");
  });

  it("uses childName from input", () => {
    const result = analyseHealth(makeInput({ childName: "Sam" }));
    expect(result.childName).toBe("Sam");
  });

  it("scores 0-100", () => {
    const result = analyseHealth(makeInput());
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("returns excellent for full health compliance", () => {
    const result = analyseHealth(makeInput());
    expect(result.overallRating).toBe("excellent");
  });
});

// ── Assessment Status ──────────────────────────────────────────────────────

describe("assessmentStatus", () => {
  it("is current when not overdue", () => {
    const result = analyseHealth(makeInput());
    expect(result.assessmentStatus).toBe("current");
  });

  it("is overdue when flagged", () => {
    const result = analyseHealth(makeInput({ assessmentOverdue: true }));
    expect(result.assessmentStatus).toBe("overdue");
  });

  it("is overdue when no assessments exist", () => {
    const result = analyseHealth(makeInput({ healthAssessments: [] }));
    expect(result.assessmentStatus).toBe("overdue");
  });
});

// ── Assessment Score ───────────────────────────────────────────────────────

describe("assessmentScore", () => {
  it("is high with current assessments and immunisations", () => {
    const result = analyseHealth(makeInput());
    expect(result.assessmentScore).toBeGreaterThanOrEqual(80);
  });

  it("is lower when assessment overdue", () => {
    const current = analyseHealth(makeInput());
    const overdue = analyseHealth(makeInput({ assessmentOverdue: true }));
    expect(overdue.assessmentScore).toBeLessThan(current.assessmentScore);
  });

  it("rewards health action plan", () => {
    const withPlan = analyseHealth(makeInput());
    const withoutPlan = analyseHealth(makeInput({
      healthActionPlanInPlace: false,
      healthActionPlanReviewed: false,
    }));
    expect(withPlan.assessmentScore).toBeGreaterThan(withoutPlan.assessmentScore);
  });

  it("rewards health passport", () => {
    const with_ = analyseHealth(makeInput());
    const without_ = analyseHealth(makeInput({ healthPassportUpToDate: false }));
    expect(with_.assessmentScore).toBeGreaterThan(without_.assessmentScore);
  });
});

// ── Registration Score ─────────────────────────────────────────────────────

describe("registrationScore", () => {
  it("is 100 with all registrations and checks", () => {
    const result = analyseHealth(makeInput());
    expect(result.registrationScore).toBe(100);
  });

  it("drops without GP registration", () => {
    const with_ = analyseHealth(makeInput());
    const without_ = analyseHealth(makeInput({ gpRegistered: false }));
    expect(without_.registrationScore).toBeLessThan(with_.registrationScore);
  });

  it("drops without dentist registration", () => {
    const with_ = analyseHealth(makeInput());
    const without_ = analyseHealth(makeInput({ dentistRegistered: false }));
    expect(without_.registrationScore).toBeLessThan(with_.registrationScore);
  });

  it("drops without dental check", () => {
    const with_ = analyseHealth(makeInput());
    const without_ = analyseHealth(makeInput({ dentalCheckLast6Months: false }));
    expect(without_.registrationScore).toBeLessThan(with_.registrationScore);
  });
});

// ── Appointment Score ──────────────────────────────────────────────────────

describe("appointmentScore", () => {
  it("is high with full attendance", () => {
    const result = analyseHealth(makeInput());
    expect(result.appointmentScore).toBeGreaterThanOrEqual(80);
  });

  it("is lower with missed appointments", () => {
    const good = analyseHealth(makeInput());
    const poor = analyseHealth(makeInput({
      appointments: [
        { date: "2026-03-10", type: "gp", attended: false },
        { date: "2026-04-05", type: "dental", attended: false },
        { date: "2026-04-20", type: "specialist", attended: true },
      ],
    }));
    expect(poor.appointmentScore).toBeLessThan(good.appointmentScore);
  });

  it("accounts for medication compliance", () => {
    const compliant = analyseHealth(makeInput({
      medications: [
        { name: "Med A", prescribed: true, administeredCorrectly: true, consentInPlace: true, reviewDue: false },
      ],
    }));
    const nonCompliant = analyseHealth(makeInput({
      medications: [
        { name: "Med A", prescribed: true, administeredCorrectly: false, consentInPlace: false, reviewDue: false },
      ],
    }));
    expect(nonCompliant.appointmentScore).toBeLessThan(compliant.appointmentScore);
  });
});

// ── Lifestyle Score ────────────────────────────────────────────────────────

describe("lifestyleScore", () => {
  it("is high with good lifestyle", () => {
    const result = analyseHealth(makeInput());
    expect(result.lifestyleScore).toBeGreaterThanOrEqual(80);
  });

  it("is lower without physical activity", () => {
    const with_ = analyseHealth(makeInput());
    const without_ = analyseHealth(makeInput({ physicalActivityRegular: false }));
    expect(without_.lifestyleScore).toBeLessThan(with_.lifestyleScore);
  });

  it("is lower with substance misuse and no support", () => {
    const noIssue = analyseHealth(makeInput());
    const withIssue = analyseHealth(makeInput({
      substanceMisuseIdentified: true,
      substanceMisuseSupport: false,
    }));
    expect(withIssue.lifestyleScore).toBeLessThan(noIssue.lifestyleScore);
  });

  it("partially recovers with substance misuse support", () => {
    const noSupport = analyseHealth(makeInput({
      substanceMisuseIdentified: true,
      substanceMisuseSupport: false,
    }));
    const withSupport = analyseHealth(makeInput({
      substanceMisuseIdentified: true,
      substanceMisuseSupport: true,
    }));
    expect(withSupport.lifestyleScore).toBeGreaterThan(noSupport.lifestyleScore);
  });
});

// ── Key Metrics ────────────────────────────────────────────────────────────

describe("key metrics", () => {
  it("calculates immunisation rate", () => {
    const result = analyseHealth(makeInput({
      immunisations: [
        { name: "A", due: false, overdue: false },
        { name: "B", due: true, overdue: false },
        { name: "C", due: false, overdue: true },
        { name: "D", due: false, overdue: false },
      ],
    }));
    expect(result.immunisationRate).toBe(0.5);
  });

  it("calculates appointment attendance rate", () => {
    const result = analyseHealth(makeInput({
      appointments: [
        { date: "2026-03-01", type: "gp", attended: true },
        { date: "2026-03-15", type: "dental", attended: false },
      ],
    }));
    expect(result.appointmentAttendanceRate).toBe(0.5);
  });

  it("returns true medication compliance when all correct", () => {
    const result = analyseHealth(makeInput({
      medications: [
        { name: "A", prescribed: true, administeredCorrectly: true, consentInPlace: true, reviewDue: false },
      ],
    }));
    expect(result.medicationCompliance).toBe(true);
  });

  it("returns false medication compliance when issues", () => {
    const result = analyseHealth(makeInput({
      medications: [
        { name: "A", prescribed: true, administeredCorrectly: false, consentInPlace: true, reviewDue: false },
      ],
    }));
    expect(result.medicationCompliance).toBe(false);
  });

  it("calculates health action progress", () => {
    const result = analyseHealth(makeInput({ actionsTotal: 4, actionsCompleted: 3 }));
    expect(result.healthActionProgress).toBe(75);
  });

  it("returns 100 progress when no actions", () => {
    const result = analyseHealth(makeInput({ actionsTotal: 0, actionsCompleted: 0 }));
    expect(result.healthActionProgress).toBe(100);
  });
});

// ── Concerns ───────────────────────────────────────────────────────────────

describe("concerns", () => {
  it("returns no concerns for healthy profile", () => {
    const result = analyseHealth(makeInput());
    expect(result.concerns).toHaveLength(0);
  });

  it("raises critical for overdue assessment", () => {
    const result = analyseHealth(makeInput({ assessmentOverdue: true }));
    const c = result.concerns.find(c => c.category === "assessment");
    expect(c).toBeDefined();
    expect(c!.severity).toBe("critical");
  });

  it("raises critical for no GP", () => {
    const result = analyseHealth(makeInput({ gpRegistered: false }));
    const c = result.concerns.find(c => c.category === "registration");
    expect(c).toBeDefined();
    expect(c!.severity).toBe("critical");
  });

  it("raises concern for overdue immunisations", () => {
    const result = analyseHealth(makeInput({
      immunisations: [
        { name: "A", due: false, overdue: true },
      ],
    }));
    const c = result.concerns.find(c => c.category === "immunisation");
    expect(c).toBeDefined();
    expect(c!.severity).toBe("significant");
  });

  it("raises concern for dental check overdue", () => {
    const result = analyseHealth(makeInput({ dentalCheckLast6Months: false }));
    const c = result.concerns.find(c => c.category === "dental");
    expect(c).toBeDefined();
  });

  it("raises concern for poor appointment attendance", () => {
    const result = analyseHealth(makeInput({
      appointments: [
        { date: "2026-03-01", type: "gp", attended: false },
        { date: "2026-03-15", type: "dental", attended: false },
        { date: "2026-04-01", type: "specialist", attended: false },
        { date: "2026-04-10", type: "gp", attended: true },
      ],
    }));
    const c = result.concerns.find(c => c.category === "appointments");
    expect(c).toBeDefined();
  });

  it("raises concern for medication non-compliance", () => {
    const result = analyseHealth(makeInput({
      medications: [
        { name: "A", prescribed: true, administeredCorrectly: false, consentInPlace: true, reviewDue: false },
      ],
    }));
    const c = result.concerns.find(c => c.category === "medication");
    expect(c).toBeDefined();
  });

  it("raises concern for substance misuse without support", () => {
    const result = analyseHealth(makeInput({
      substanceMisuseIdentified: true,
      substanceMisuseSupport: false,
    }));
    const c = result.concerns.find(c => c.category === "substance_misuse");
    expect(c).toBeDefined();
  });
});

// ── Strengths ──────────────────────────────────────────────────────────────

describe("strengths", () => {
  it("includes assessment current", () => {
    const result = analyseHealth(makeInput());
    expect(result.strengths.some(s => s.category === "assessment")).toBe(true);
  });

  it("includes immunisations up to date", () => {
    const result = analyseHealth(makeInput());
    expect(result.strengths.some(s => s.category === "immunisation")).toBe(true);
  });

  it("includes all registrations", () => {
    const result = analyseHealth(makeInput());
    expect(result.strengths.some(s => s.category === "registration")).toBe(true);
  });

  it("includes good appointment attendance", () => {
    const result = analyseHealth(makeInput());
    expect(result.strengths.some(s => s.category === "appointments")).toBe(true);
  });

  it("includes healthy lifestyle", () => {
    const result = analyseHealth(makeInput());
    expect(result.strengths.some(s => s.category === "lifestyle")).toBe(true);
  });
});

// ── Regulatory Flags ───────────────────────────────────────────────────────

describe("regulatoryFlags", () => {
  it("Reg 6(2)(b) met for full compliance", () => {
    const result = analyseHealth(makeInput());
    const f = result.regulatoryFlags.find(f => f.area === "Physical Health");
    expect(f).toBeDefined();
    expect(f!.status).toBe("met");
  });

  it("Reg 6(2)(b) not met with overdue assessment and no GP", () => {
    const result = analyseHealth(makeInput({
      assessmentOverdue: true,
      gpRegistered: false,
      healthAssessments: [],
    }));
    const f = result.regulatoryFlags.find(f => f.area === "Physical Health");
    expect(f).toBeDefined();
    expect(f!.status).toBe("not_met");
  });

  it("Promoting Health of LAC met when all checks done", () => {
    const result = analyseHealth(makeInput());
    const f = result.regulatoryFlags.find(f => f.area === "Health Checks");
    expect(f).toBeDefined();
    expect(f!.status).toBe("met");
  });

  it("SCCIF health met for good profile", () => {
    const result = analyseHealth(makeInput());
    const f = result.regulatoryFlags.find(f => f.area === "Health Outcomes");
    expect(f).toBeDefined();
    expect(f!.status).toBe("met");
  });

  it("Medication regulation met when all correct", () => {
    const result = analyseHealth(makeInput({
      medications: [
        { name: "A", prescribed: true, administeredCorrectly: true, consentInPlace: true, reviewDue: false },
      ],
    }));
    const f = result.regulatoryFlags.find(f => f.area === "Medication");
    expect(f).toBeDefined();
    expect(f!.status).toBe("met");
  });

  it("Medication not met when consent missing", () => {
    const result = analyseHealth(makeInput({
      medications: [
        { name: "A", prescribed: true, administeredCorrectly: true, consentInPlace: false, reviewDue: false },
      ],
    }));
    const f = result.regulatoryFlags.find(f => f.area === "Medication");
    expect(f).toBeDefined();
    expect(f!.status).toBe("not_met");
  });
});

// ── Recommendations ────────────────────────────────────────────────────────

describe("recommendations", () => {
  it("returns empty for healthy profile", () => {
    const result = analyseHealth(makeInput());
    expect(result.recommendations).toHaveLength(0);
  });

  it("URGENT for overdue assessment", () => {
    const result = analyseHealth(makeInput({ assessmentOverdue: true }));
    expect(result.recommendations.some(r => r.includes("URGENT"))).toBe(true);
  });

  it("URGENT for no GP", () => {
    const result = analyseHealth(makeInput({ gpRegistered: false }));
    expect(result.recommendations.some(r => r.includes("URGENT") && r.includes("GP"))).toBe(true);
  });

  it("recommends dental check", () => {
    const result = analyseHealth(makeInput({ dentalCheckLast6Months: false }));
    expect(result.recommendations.some(r => r.toLowerCase().includes("dental"))).toBe(true);
  });

  it("recommends immunisation catch-up", () => {
    const result = analyseHealth(makeInput({
      immunisations: [{ name: "A", due: true, overdue: false }],
    }));
    expect(result.recommendations.some(r => r.toLowerCase().includes("immunisation"))).toBe(true);
  });

  it("recommends substance misuse support", () => {
    const result = analyseHealth(makeInput({
      substanceMisuseIdentified: true,
      substanceMisuseSupport: false,
    }));
    expect(result.recommendations.some(r => r.toLowerCase().includes("substance"))).toBe(true);
  });

  it("recommends health action plan", () => {
    const result = analyseHealth(makeInput({ healthActionPlanInPlace: false }));
    expect(result.recommendations.some(r => r.toLowerCase().includes("health action plan"))).toBe(true);
  });
});

// ── Summary ────────────────────────────────────────────────────────────────

describe("summary", () => {
  it("includes child name", () => {
    const result = analyseHealth(makeInput({ childName: "Sam" }));
    expect(result.summary).toContain("Sam");
  });

  it("includes assessment status", () => {
    const result = analyseHealth(makeInput());
    expect(result.summary).toContain("assessment current");
  });

  it("mentions overdue when applicable", () => {
    const result = analyseHealth(makeInput({ assessmentOverdue: true }));
    expect(result.summary).toContain("OVERDUE");
  });

  it("mentions immunisation status", () => {
    const result = analyseHealth(makeInput());
    expect(result.summary).toContain("immunisations up to date");
  });
});
