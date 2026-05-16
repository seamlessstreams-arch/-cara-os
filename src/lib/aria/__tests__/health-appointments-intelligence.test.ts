// ══════════════════════════════════════════════════════════════════════════════
// Tests — Health Appointments Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  analyseHealthAppointments,
  HealthInput,
  HealthAppointment,
  HealthAssessment,
  AppointmentType,
} from "../health-appointments-intelligence";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeInput(overrides: Partial<HealthInput> = {}): HealthInput {
  return {
    childId: "child_1",
    childName: "Jordan",
    age: 14,
    dateEnteredCare: "2025-01-15",
    hasIHA: true,
    ihaDate: "2025-02-01",
    ihaWithin20Days: true,
    lastRHADate: "2026-02-01",
    lastDentalDate: "2026-03-01",
    lastOpticalDate: "2026-01-15",
    lastSDQDate: "2026-01-10",
    sdqScore: 12,
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

function makeAppointment(overrides: Partial<HealthAppointment> = {}): HealthAppointment {
  return {
    id: `appt_${Math.random().toString(36).slice(2)}`,
    type: "gp",
    date: "2026-04-15",
    status: "attended",
    ...overrides,
  };
}

// Use a fixed "today" for deterministic tests — mock Date.now
const FIXED_TODAY = new Date("2026-05-16T12:00:00Z").getTime();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_TODAY);
});

// ═══════════════════════════════════════════════════════════════════════════════

describe("Health Appointments Intelligence Engine", () => {
  // ── Basic functionality ─────────────────────────────────────────────────

  describe("Basic functionality", () => {
    it("returns a valid assessment structure", () => {
      const result = analyseHealthAppointments(makeInput());
      expect(result).toHaveProperty("overallScore");
      expect(result).toHaveProperty("overallRating");
      expect(result).toHaveProperty("statutoryComplianceScore");
      expect(result).toHaveProperty("attendanceScore");
      expect(result).toHaveProperty("timelinessScore");
      expect(result).toHaveProperty("coverageScore");
      expect(result).toHaveProperty("statutoryChecks");
      expect(result).toHaveProperty("overdueAppointments");
      expect(result).toHaveProperty("upcomingAppointments");
      expect(result).toHaveProperty("dnaPattern");
      expect(result).toHaveProperty("concerns");
      expect(result).toHaveProperty("strengths");
      expect(result).toHaveProperty("regulatoryFlags");
      expect(result).toHaveProperty("recommendations");
      expect(result).toHaveProperty("summary");
    });

    it("uses childName in summary", () => {
      const result = analyseHealthAppointments(makeInput({ childName: "Sam" }));
      expect(result.childName).toBe("Sam");
      expect(result.summary).toContain("Sam");
    });
  });

  // ── Statutory checks ────────────────────────────────────────────────────

  describe("Statutory checks", () => {
    it("IHA marked met when completed", () => {
      const result = analyseHealthAppointments(makeInput({ hasIHA: true, ihaDate: "2025-02-01" }));
      const iha = result.statutoryChecks.find(c => c.type === "IHA");
      expect(iha).toBeDefined();
      expect(iha!.status).toBe("met");
    });

    it("IHA marked overdue when not completed and >28 days since entering care", () => {
      const result = analyseHealthAppointments(makeInput({
        hasIHA: false,
        dateEnteredCare: "2026-03-01", // >28 days before today (2026-05-16)
      }));
      const iha = result.statutoryChecks.find(c => c.type === "IHA");
      expect(iha).toBeDefined();
      expect(iha!.status).toBe("overdue");
    });

    it("IHA marked due_soon when within 28 days of entering care", () => {
      const result = analyseHealthAppointments(makeInput({
        hasIHA: false,
        dateEnteredCare: "2026-05-01", // 15 days before today
      }));
      const iha = result.statutoryChecks.find(c => c.type === "IHA");
      expect(iha).toBeDefined();
      expect(iha!.status).toBe("due_soon");
    });

    it("RHA marked met when within last year", () => {
      const result = analyseHealthAppointments(makeInput({ lastRHADate: "2026-02-01" }));
      const rha = result.statutoryChecks.find(c => c.type === "RHA");
      expect(rha).toBeDefined();
      expect(rha!.status).toBe("met");
    });

    it("RHA marked overdue when more than a year", () => {
      const result = analyseHealthAppointments(makeInput({ lastRHADate: "2025-01-01" }));
      const rha = result.statutoryChecks.find(c => c.type === "RHA");
      expect(rha).toBeDefined();
      expect(rha!.status).toBe("overdue");
    });

    it("RHA marked due_soon when approaching 365 days", () => {
      // 340 days before 2026-05-16 = 2025-06-11
      const result = analyseHealthAppointments(makeInput({ lastRHADate: "2025-06-11" }));
      const rha = result.statutoryChecks.find(c => c.type === "RHA");
      expect(rha).toBeDefined();
      expect(rha!.status).toBe("due_soon");
    });

    it("Dental marked overdue when >183 days", () => {
      const result = analyseHealthAppointments(makeInput({ lastDentalDate: "2025-09-01" }));
      const dental = result.statutoryChecks.find(c => c.type === "Dental");
      expect(dental).toBeDefined();
      expect(dental!.status).toBe("overdue");
    });

    it("Dental marked met when within 6 months", () => {
      const result = analyseHealthAppointments(makeInput({ lastDentalDate: "2026-03-01" }));
      const dental = result.statutoryChecks.find(c => c.type === "Dental");
      expect(dental).toBeDefined();
      expect(dental!.status).toBe("met");
    });

    it("Optical marked overdue when >365 days", () => {
      const result = analyseHealthAppointments(makeInput({ lastOpticalDate: "2025-01-01" }));
      const optical = result.statutoryChecks.find(c => c.type === "Optical");
      expect(optical).toBeDefined();
      expect(optical!.status).toBe("overdue");
    });

    it("SDQ marked overdue when >365 days", () => {
      const result = analyseHealthAppointments(makeInput({ lastSDQDate: "2025-01-01" }));
      const sdq = result.statutoryChecks.find(c => c.type === "SDQ");
      expect(sdq).toBeDefined();
      expect(sdq!.status).toBe("overdue");
    });

    it("Immunisations met when up to date", () => {
      const result = analyseHealthAppointments(makeInput({ immunisationsUpToDate: true }));
      const imm = result.statutoryChecks.find(c => c.type === "Immunisations");
      expect(imm).toBeDefined();
      expect(imm!.status).toBe("met");
    });

    it("Immunisations overdue when not up to date", () => {
      const result = analyseHealthAppointments(makeInput({ immunisationsUpToDate: false }));
      const imm = result.statutoryChecks.find(c => c.type === "Immunisations");
      expect(imm).toBeDefined();
      expect(imm!.status).toBe("overdue");
    });
  });

  // ── Overdue appointments ───────────────────────────────────────────────

  describe("Overdue appointments", () => {
    it("identifies overdue IHA", () => {
      const result = analyseHealthAppointments(makeInput({
        hasIHA: false,
        dateEnteredCare: "2026-02-01", // 104 days ago, overdue by 76 days
      }));
      const overdue = result.overdueAppointments.find(o => o.type === "initial_health_assessment");
      expect(overdue).toBeDefined();
      expect(overdue!.daysOverdue).toBeGreaterThan(0);
    });

    it("identifies overdue RHA", () => {
      const result = analyseHealthAppointments(makeInput({ lastRHADate: "2025-01-01" }));
      const overdue = result.overdueAppointments.find(o => o.type === "review_health_assessment");
      expect(overdue).toBeDefined();
      expect(overdue!.daysOverdue).toBeGreaterThan(0);
    });

    it("no overdue items when all up to date", () => {
      const result = analyseHealthAppointments(makeInput());
      expect(result.overdueAppointments).toHaveLength(0);
    });

    it("critical severity for very overdue IHA", () => {
      const result = analyseHealthAppointments(makeInput({
        hasIHA: false,
        dateEnteredCare: "2025-11-01", // way overdue
      }));
      const overdue = result.overdueAppointments.find(o => o.type === "initial_health_assessment");
      expect(overdue).toBeDefined();
      expect(overdue!.severity).toBe("critical");
    });
  });

  // ── Upcoming appointments ──────────────────────────────────────────────

  describe("Upcoming appointments", () => {
    it("lists pending future appointments", () => {
      const result = analyseHealthAppointments(makeInput({
        appointments: [
          makeAppointment({ type: "dental", date: "2026-06-01", status: "pending" }),
          makeAppointment({ type: "gp", date: "2026-05-20", status: "pending" }),
        ],
      }));
      expect(result.upcomingAppointments.length).toBe(2);
      expect(result.upcomingAppointments[0].type).toBe("gp"); // sooner first
    });

    it("excludes past pending appointments", () => {
      const result = analyseHealthAppointments(makeInput({
        appointments: [
          makeAppointment({ type: "dental", date: "2026-04-01", status: "pending" }), // past
          makeAppointment({ type: "gp", date: "2026-06-01", status: "pending" }), // future
        ],
      }));
      expect(result.upcomingAppointments.length).toBe(1);
      expect(result.upcomingAppointments[0].type).toBe("gp");
    });

    it("limits to 5 upcoming", () => {
      const appts = Array.from({ length: 8 }, (_, i) =>
        makeAppointment({ type: "gp", date: `2026-06-${String(i + 1).padStart(2, "0")}`, status: "pending" })
      );
      const result = analyseHealthAppointments(makeInput({ appointments: appts }));
      expect(result.upcomingAppointments.length).toBe(5);
    });
  });

  // ── DNA Pattern ────────────────────────────────────────────────────────

  describe("DNA pattern", () => {
    it("calculates DNA rate correctly", () => {
      const appts = [
        makeAppointment({ status: "attended" }),
        makeAppointment({ status: "attended" }),
        makeAppointment({ status: "dna" }),
        makeAppointment({ status: "attended" }),
      ];
      const result = analyseHealthAppointments(makeInput({ appointments: appts }));
      expect(result.dnaPattern.dnaCount).toBe(1);
      expect(result.dnaPattern.dnaRate).toBe(0.25);
    });

    it("zero DNA rate when all attended", () => {
      const appts = Array.from({ length: 5 }, () => makeAppointment({ status: "attended" }));
      const result = analyseHealthAppointments(makeInput({ appointments: appts }));
      expect(result.dnaPattern.dnaRate).toBe(0);
    });

    it("identifies most common DNA types", () => {
      const appts = [
        makeAppointment({ type: "dental", status: "dna" }),
        makeAppointment({ type: "dental", status: "dna" }),
        makeAppointment({ type: "gp", status: "dna" }),
        makeAppointment({ type: "gp", status: "attended" }),
        makeAppointment({ type: "dental", status: "attended" }),
      ];
      const result = analyseHealthAppointments(makeInput({ appointments: appts }));
      expect(result.dnaPattern.types[0]).toBe("dental");
    });

    it("detects worsening trend", () => {
      // First half: all attended. Second half: lots of DNAs
      const appts = [
        ...Array.from({ length: 4 }, () => makeAppointment({ status: "attended" })),
        ...Array.from({ length: 4 }, () => makeAppointment({ status: "dna" })),
      ];
      const result = analyseHealthAppointments(makeInput({ appointments: appts }));
      expect(result.dnaPattern.trend).toBe("worsening");
    });

    it("detects improving trend", () => {
      const appts = [
        ...Array.from({ length: 4 }, () => makeAppointment({ status: "dna" })),
        ...Array.from({ length: 4 }, () => makeAppointment({ status: "attended" })),
      ];
      const result = analyseHealthAppointments(makeInput({ appointments: appts }));
      expect(result.dnaPattern.trend).toBe("improving");
    });
  });

  // ── Scoring ────────────────────────────────────────────────────────────

  describe("Scoring", () => {
    it("high statutory compliance when all checks met", () => {
      const result = analyseHealthAppointments(makeInput());
      expect(result.statutoryComplianceScore).toBeGreaterThanOrEqual(90);
    });

    it("low statutory compliance when assessments overdue", () => {
      const result = analyseHealthAppointments(makeInput({
        hasIHA: false,
        dateEnteredCare: "2026-02-01",
        lastRHADate: "2024-01-01",
        lastDentalDate: undefined,
        lastOpticalDate: undefined,
        lastSDQDate: undefined,
        immunisationsUpToDate: false,
      }));
      expect(result.statutoryComplianceScore).toBeLessThan(30);
    });

    it("attendance score reflects DNA rate", () => {
      const appts = [
        makeAppointment({ status: "attended" }),
        makeAppointment({ status: "dna" }),
        makeAppointment({ status: "attended" }),
        makeAppointment({ status: "dna" }),
      ];
      const result = analyseHealthAppointments(makeInput({ appointments: appts }));
      expect(result.attendanceScore).toBe(50); // 50% DNA
    });

    it("full coverage score when all in place", () => {
      const result = analyseHealthAppointments(makeInput());
      expect(result.coverageScore).toBe(100);
    });

    it("reduced coverage when missing registrations", () => {
      const result = analyseHealthAppointments(makeInput({
        registeredWithGP: false,
        registeredWithDentist: false,
        hasHealthPlan: false,
        healthPlanUpToDate: false,
        consentFormsComplete: false,
        immunisationsUpToDate: false,
      }));
      expect(result.coverageScore).toBe(0);
    });

    it("timeliness score perfect with no overdue", () => {
      const result = analyseHealthAppointments(makeInput());
      expect(result.timelinessScore).toBe(100);
    });
  });

  // ── Overall rating ─────────────────────────────────────────────────────

  describe("Overall rating", () => {
    it("excellent for fully compliant child", () => {
      const result = analyseHealthAppointments(makeInput({
        appointments: Array.from({ length: 5 }, () => makeAppointment({ status: "attended" })),
      }));
      expect(result.overallRating).toBe("excellent");
      expect(result.overallScore).toBeGreaterThanOrEqual(85);
    });

    it("poor rating for non-compliant", () => {
      const result = analyseHealthAppointments(makeInput({
        hasIHA: false,
        dateEnteredCare: "2026-01-01",
        lastRHADate: "2024-06-01",
        lastDentalDate: undefined,
        lastOpticalDate: undefined,
        lastSDQDate: undefined,
        immunisationsUpToDate: false,
        registeredWithGP: false,
        registeredWithDentist: false,
        hasHealthPlan: false,
        healthPlanUpToDate: false,
        consentFormsComplete: false,
      }));
      expect(["inadequate", "requires_improvement"]).toContain(result.overallRating);
      expect(result.overallScore).toBeLessThan(45);
    });
  });

  // ── Concerns ───────────────────────────────────────────────────────────

  describe("Concerns", () => {
    it("critical concern for overdue IHA", () => {
      const result = analyseHealthAppointments(makeInput({
        hasIHA: false,
        dateEnteredCare: "2026-02-01",
      }));
      const concern = result.concerns.find(c => c.category === "statutory_assessment" && c.description.includes("Initial"));
      expect(concern).toBeDefined();
      expect(concern!.severity).toBe("critical");
    });

    it("critical concern for not registered with GP", () => {
      const result = analyseHealthAppointments(makeInput({ registeredWithGP: false }));
      const concern = result.concerns.find(c => c.category === "registration" && c.description.includes("GP"));
      expect(concern).toBeDefined();
      expect(concern!.severity).toBe("critical");
    });

    it("significant concern for high DNA rate", () => {
      const appts = [
        makeAppointment({ status: "dna" }),
        makeAppointment({ status: "dna" }),
        makeAppointment({ status: "attended" }),
        makeAppointment({ status: "attended" }),
      ];
      const result = analyseHealthAppointments(makeInput({ appointments: appts }));
      const concern = result.concerns.find(c => c.category === "attendance");
      expect(concern).toBeDefined();
      expect(concern!.severity).toBe("significant");
    });

    it("concern for no health plan", () => {
      const result = analyseHealthAppointments(makeInput({ hasHealthPlan: false }));
      const concern = result.concerns.find(c => c.category === "care_planning");
      expect(concern).toBeDefined();
    });

    it("concern for immunisations not up to date", () => {
      const result = analyseHealthAppointments(makeInput({ immunisationsUpToDate: false }));
      const concern = result.concerns.find(c => c.category === "immunisations");
      expect(concern).toBeDefined();
    });

    it("no concerns for fully compliant child", () => {
      const result = analyseHealthAppointments(makeInput());
      expect(result.concerns).toHaveLength(0);
    });
  });

  // ── Strengths ──────────────────────────────────────────────────────────

  describe("Strengths", () => {
    it("identifies all statutory assessments up to date", () => {
      const result = analyseHealthAppointments(makeInput());
      const s = result.strengths.find(s => s.category === "compliance");
      expect(s).toBeDefined();
    });

    it("identifies 100% attendance", () => {
      const appts = Array.from({ length: 6 }, () => makeAppointment({ status: "attended" }));
      const result = analyseHealthAppointments(makeInput({ appointments: appts }));
      const s = result.strengths.find(s => s.category === "attendance");
      expect(s).toBeDefined();
    });

    it("identifies registration completeness", () => {
      const result = analyseHealthAppointments(makeInput());
      const s = result.strengths.find(s => s.category === "registration");
      expect(s).toBeDefined();
    });

    it("identifies health plan as strength", () => {
      const result = analyseHealthAppointments(makeInput());
      const s = result.strengths.find(s => s.category === "care_planning");
      expect(s).toBeDefined();
    });
  });

  // ── Regulatory flags ───────────────────────────────────────────────────

  describe("Regulatory flags", () => {
    it("all met for compliant child", () => {
      const result = analyseHealthAppointments(makeInput({
        appointments: Array.from({ length: 5 }, () => makeAppointment({ status: "attended" })),
      }));
      const unmet = result.regulatoryFlags.filter(f => f.status !== "met");
      expect(unmet).toHaveLength(0);
    });

    it("CHR Reg 6(2)(b) not_met when critical issues", () => {
      const result = analyseHealthAppointments(makeInput({ registeredWithGP: false }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 6(2)(b)");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("not_met");
    });

    it("NICE PH28 not_met when not registered with dentist", () => {
      const result = analyseHealthAppointments(makeInput({ registeredWithDentist: false }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "NICE PH28");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("not_met");
    });

    it("Promoting Health of LAC not_met when IHA overdue", () => {
      const result = analyseHealthAppointments(makeInput({
        hasIHA: false,
        dateEnteredCare: "2026-02-01",
      }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "Promoting Health of LAC 2015");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("not_met");
    });
  });

  // ── Recommendations ────────────────────────────────────────────────────

  describe("Recommendations", () => {
    it("recommends urgent IHA when overdue", () => {
      const result = analyseHealthAppointments(makeInput({
        hasIHA: false,
        dateEnteredCare: "2026-02-01",
      }));
      expect(result.recommendations.some(r => r.includes("URGENT") && r.includes("Initial Health Assessment"))).toBe(true);
    });

    it("recommends GP registration when missing", () => {
      const result = analyseHealthAppointments(makeInput({ registeredWithGP: false }));
      expect(result.recommendations.some(r => r.includes("GP"))).toBe(true);
    });

    it("recommends dentist registration when missing", () => {
      const result = analyseHealthAppointments(makeInput({ registeredWithDentist: false }));
      expect(result.recommendations.some(r => r.includes("dentist"))).toBe(true);
    });

    it("recommends health plan when missing", () => {
      const result = analyseHealthAppointments(makeInput({ hasHealthPlan: false }));
      expect(result.recommendations.some(r => r.includes("health plan"))).toBe(true);
    });

    it("recommends addressing DNA pattern", () => {
      const appts = [
        makeAppointment({ status: "dna" }),
        makeAppointment({ status: "dna" }),
        makeAppointment({ status: "attended" }),
        makeAppointment({ status: "attended" }),
      ];
      const result = analyseHealthAppointments(makeInput({ appointments: appts }));
      expect(result.recommendations.some(r => r.includes("DNA"))).toBe(true);
    });

    it("recommends immunisation catch-up", () => {
      const result = analyseHealthAppointments(makeInput({ immunisationsUpToDate: false }));
      expect(result.recommendations.some(r => r.includes("immunisation"))).toBe(true);
    });

    it("minimal recommendations for compliant child", () => {
      const result = analyseHealthAppointments(makeInput());
      expect(result.recommendations.length).toBeLessThanOrEqual(1);
    });
  });
});
