// ══════════════════════════════════════════════════════════════════════════════
// Tests — Independence & Pathway Planning Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  analyseIndependence,
  IndependenceInput,
  LifeSkill,
  SkillLevel,
  EETStatus,
  PathwayPlan,
  AccommodationPlan,
} from "../independence-intelligence";

// ── Helpers ─────────────────────────────────────────────────────────────────

const FIXED_NOW = new Date("2026-05-16T12:00:00Z").getTime();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

function makeSkill(overrides: Partial<LifeSkill> = {}): LifeSkill {
  return {
    name: "Cooking a meal",
    category: "cooking_nutrition",
    level: "developing",
    targetLevel: "competent",
    ...overrides,
  };
}

function makePathwayPlan(overrides: Partial<PathwayPlan> = {}): PathwayPlan {
  return {
    exists: true,
    upToDate: true,
    youngPersonParticipated: true,
    personalAdviserAssigned: true,
    goalsSet: true,
    goalsProgress: 70,
    ...overrides,
  };
}

function makeAccommodationPlan(overrides: Partial<AccommodationPlan> = {}): AccommodationPlan {
  return {
    identified: true,
    type: "semi_independent",
    readinessAssessed: true,
    transitionPlanned: true,
    emergencyPlanInPlace: true,
    ...overrides,
  };
}

function makeInput(overrides: Partial<IndependenceInput> = {}): IndependenceInput {
  return {
    childId: "child_1",
    childName: "Jordan",
    age: 16,
    lifeSkills: [
      makeSkill({ name: "Cooking basics", category: "cooking_nutrition", level: "developing" }),
      makeSkill({ name: "Budgeting", category: "budgeting_finance", level: "developing" }),
      makeSkill({ name: "Laundry", category: "household_tasks", level: "competent" }),
      makeSkill({ name: "Using buses", category: "transport_travel", level: "competent" }),
      makeSkill({ name: "GP visits", category: "health_management", level: "developing" }),
    ],
    eetStatus: "in_education",
    pathwayPlan: makePathwayPlan(),
    accommodationPlan: makeAccommodationPlan(),
    hasBankAccount: true,
    financialLiteracyStarted: true,
    hasNINumber: true,
    hasBirthCertificate: true,
    hasPassportOrID: true,
    registeredWithGPIndependently: true,
    canManageMedication: true,
    hasSupportNetwork: true,
    supportNetworkMapped: true,
    keyRelationshipsIdentified: true,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════

describe("Independence & Pathway Planning Intelligence Engine", () => {

  // ── Basic functionality ─────────────────────────────────────────────────

  describe("Basic functionality", () => {
    it("returns valid assessment structure", () => {
      const result = analyseIndependence(makeInput());
      expect(result).toHaveProperty("overallScore");
      expect(result).toHaveProperty("overallRating");
      expect(result).toHaveProperty("skillsScore");
      expect(result).toHaveProperty("eetScore");
      expect(result).toHaveProperty("planningScore");
      expect(result).toHaveProperty("practicalReadinessScore");
      expect(result).toHaveProperty("totalSkills");
      expect(result).toHaveProperty("skillsByCategory");
      expect(result).toHaveProperty("concerns");
      expect(result).toHaveProperty("strengths");
      expect(result).toHaveProperty("regulatoryFlags");
      expect(result).toHaveProperty("recommendations");
      expect(result).toHaveProperty("summary");
    });

    it("uses childName", () => {
      const result = analyseIndependence(makeInput({ childName: "Sam" }));
      expect(result.childName).toBe("Sam");
      expect(result.summary).toContain("Sam");
    });

    it("scores are all 0-100", () => {
      const result = analyseIndependence(makeInput());
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.skillsScore).toBeGreaterThanOrEqual(0);
      expect(result.skillsScore).toBeLessThanOrEqual(100);
      expect(result.eetScore).toBeGreaterThanOrEqual(0);
      expect(result.eetScore).toBeLessThanOrEqual(100);
      expect(result.planningScore).toBeGreaterThanOrEqual(0);
      expect(result.planningScore).toBeLessThanOrEqual(100);
      expect(result.practicalReadinessScore).toBeGreaterThanOrEqual(0);
      expect(result.practicalReadinessScore).toBeLessThanOrEqual(100);
    });
  });

  // ── Skills scoring ────────────────────────────────────────────────────

  describe("Skills scoring", () => {
    it("high score for competent/independent skills at 16", () => {
      const result = analyseIndependence(makeInput({
        lifeSkills: [
          makeSkill({ level: "competent" }),
          makeSkill({ level: "competent" }),
          makeSkill({ level: "independent" }),
          makeSkill({ level: "competent" }),
          makeSkill({ level: "independent" }),
        ],
      }));
      expect(result.skillsScore).toBe(100);
    });

    it("low score for not_started skills at 17", () => {
      const result = analyseIndependence(makeInput({
        age: 17,
        lifeSkills: [
          makeSkill({ level: "not_started" }),
          makeSkill({ level: "not_started" }),
          makeSkill({ level: "emerging" }),
        ],
      }));
      expect(result.skillsScore).toBeLessThan(40);
    });

    it("very low score when no skills tracked for 16+", () => {
      const result = analyseIndependence(makeInput({
        age: 16,
        lifeSkills: [],
      }));
      expect(result.skillsScore).toBe(10);
    });

    it("lenient score when no skills tracked for under 16", () => {
      const result = analyseIndependence(makeInput({
        age: 14,
        lifeSkills: [],
      }));
      expect(result.skillsScore).toBe(30);
    });

    it("counts skills at target correctly", () => {
      const result = analyseIndependence(makeInput({
        lifeSkills: [
          makeSkill({ level: "competent", targetLevel: "competent" }), // at target
          makeSkill({ level: "independent", targetLevel: "competent" }), // above target
          makeSkill({ level: "developing", targetLevel: "competent" }), // below target
        ],
      }));
      expect(result.skillsAtTarget).toBe(2);
      expect(result.skillsBelowTarget).toBe(1);
    });
  });

  // ── Category analysis ─────────────────────────────────────────────────

  describe("Category analysis", () => {
    it("groups skills by category", () => {
      const result = analyseIndependence(makeInput({
        lifeSkills: [
          makeSkill({ name: "Cook meal", category: "cooking_nutrition", level: "competent" }),
          makeSkill({ name: "Food hygiene", category: "cooking_nutrition", level: "developing" }),
          makeSkill({ name: "Budget weekly", category: "budgeting_finance", level: "emerging" }),
        ],
      }));
      expect(result.skillsByCategory.length).toBe(2);
      const cooking = result.skillsByCategory.find(c => c.category === "cooking_nutrition");
      expect(cooking).toBeDefined();
      expect(cooking!.skillCount).toBe(2);
      expect(cooking!.avgLevel).toBe(2.5); // (3+2)/2
    });

    it("tracks at-target per category", () => {
      const result = analyseIndependence(makeInput({
        lifeSkills: [
          makeSkill({ category: "cooking_nutrition", level: "competent", targetLevel: "competent" }),
          makeSkill({ category: "cooking_nutrition", level: "emerging", targetLevel: "competent" }),
        ],
      }));
      const cooking = result.skillsByCategory.find(c => c.category === "cooking_nutrition");
      expect(cooking!.atTarget).toBe(1);
    });
  });

  // ── EET scoring ───────────────────────────────────────────────────────

  describe("EET scoring", () => {
    it("100 for in education at 16+", () => {
      const result = analyseIndependence(makeInput({ eetStatus: "in_education" }));
      expect(result.eetScore).toBe(100);
    });

    it("100 for in employment at 16+", () => {
      const result = analyseIndependence(makeInput({ eetStatus: "in_employment" }));
      expect(result.eetScore).toBe(100);
    });

    it("90 for in training", () => {
      const result = analyseIndependence(makeInput({ eetStatus: "in_training" }));
      expect(result.eetScore).toBe(90);
    });

    it("20 for NEET at 16+", () => {
      const result = analyseIndependence(makeInput({ eetStatus: "neet" }));
      expect(result.eetScore).toBe(20);
    });

    it("50 for NEET with plan at 16+", () => {
      const result = analyseIndependence(makeInput({ eetStatus: "neet_with_plan" }));
      expect(result.eetScore).toBe(50);
    });

    it("100 for in education under 16", () => {
      const result = analyseIndependence(makeInput({ age: 14, eetStatus: "in_education" }));
      expect(result.eetScore).toBe(100);
    });
  });

  // ── Planning scoring ──────────────────────────────────────────────────

  describe("Planning scoring", () => {
    it("100 for full pathway plan + accommodation", () => {
      const result = analyseIndependence(makeInput());
      expect(result.planningScore).toBe(100);
    });

    it("low score with no pathway plan and no accommodation", () => {
      const result = analyseIndependence(makeInput({
        pathwayPlan: makePathwayPlan({
          exists: false,
          upToDate: false,
          youngPersonParticipated: false,
          personalAdviserAssigned: false,
          goalsSet: false,
          goalsProgress: 0,
        }),
        accommodationPlan: makeAccommodationPlan({
          identified: false,
          readinessAssessed: false,
          transitionPlanned: false,
          emergencyPlanInPlace: false,
        }),
      }));
      expect(result.planningScore).toBe(0);
    });

    it("partial score for pathway plan only", () => {
      const result = analyseIndependence(makeInput({
        accommodationPlan: makeAccommodationPlan({
          identified: false,
          readinessAssessed: false,
          transitionPlanned: false,
          emergencyPlanInPlace: false,
        }),
      }));
      expect(result.planningScore).toBeGreaterThan(40);
      expect(result.planningScore).toBeLessThan(70);
    });
  });

  // ── Practical readiness scoring ───────────────────────────────────────

  describe("Practical readiness scoring", () => {
    it("100 for all practical items in place", () => {
      const result = analyseIndependence(makeInput());
      expect(result.practicalReadinessScore).toBe(100);
    });

    it("0 when nothing in place", () => {
      const result = analyseIndependence(makeInput({
        hasBankAccount: false,
        financialLiteracyStarted: false,
        hasNINumber: false,
        hasBirthCertificate: false,
        hasPassportOrID: false,
        registeredWithGPIndependently: false,
        canManageMedication: false,
        hasSupportNetwork: false,
        supportNetworkMapped: false,
      }));
      expect(result.practicalReadinessScore).toBe(0);
    });

    it("partial for some items", () => {
      const result = analyseIndependence(makeInput({
        hasBankAccount: true,
        hasNINumber: true,
        hasBirthCertificate: true,
        hasPassportOrID: false,
        financialLiteracyStarted: false,
        registeredWithGPIndependently: false,
        canManageMedication: false,
        hasSupportNetwork: false,
        supportNetworkMapped: false,
      }));
      expect(result.practicalReadinessScore).toBe(45);
    });
  });

  // ── Overall rating ────────────────────────────────────────────────────

  describe("Overall rating", () => {
    it("excellent for fully prepared young person", () => {
      const result = analyseIndependence(makeInput());
      expect(result.overallRating).toBe("excellent");
    });

    it("inadequate for completely unprepared 17 year old", () => {
      const result = analyseIndependence(makeInput({
        age: 17,
        lifeSkills: [],
        eetStatus: "neet",
        pathwayPlan: makePathwayPlan({
          exists: false,
          upToDate: false,
          youngPersonParticipated: false,
          personalAdviserAssigned: false,
          goalsSet: false,
          goalsProgress: 0,
        }),
        accommodationPlan: makeAccommodationPlan({
          identified: false,
          readinessAssessed: false,
          transitionPlanned: false,
          emergencyPlanInPlace: false,
        }),
        hasBankAccount: false,
        financialLiteracyStarted: false,
        hasNINumber: false,
        hasBirthCertificate: false,
        hasPassportOrID: false,
        registeredWithGPIndependently: false,
        canManageMedication: false,
        hasSupportNetwork: false,
        supportNetworkMapped: false,
      }));
      expect(result.overallRating).toBe("inadequate");
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────────

  describe("Concerns", () => {
    it("critical concern for no pathway plan at 16+", () => {
      const result = analyseIndependence(makeInput({
        pathwayPlan: makePathwayPlan({ exists: false, upToDate: false }),
      }));
      const c = result.concerns.find(c => c.category === "pathway_plan");
      expect(c).toBeDefined();
      expect(c!.severity).toBe("critical");
    });

    it("significant concern for outdated pathway plan", () => {
      const result = analyseIndependence(makeInput({
        pathwayPlan: makePathwayPlan({ upToDate: false }),
      }));
      const c = result.concerns.find(c => c.category === "pathway_plan");
      expect(c).toBeDefined();
      expect(c!.severity).toBe("significant");
    });

    it("critical concern for NEET at 16+", () => {
      const result = analyseIndependence(makeInput({ eetStatus: "neet" }));
      const c = result.concerns.find(c => c.category === "eet");
      expect(c).toBeDefined();
      expect(c!.severity).toBe("critical");
    });

    it("significant concern for NEET with plan at 16+", () => {
      const result = analyseIndependence(makeInput({ eetStatus: "neet_with_plan" }));
      const c = result.concerns.find(c => c.category === "eet");
      expect(c).toBeDefined();
      expect(c!.severity).toBe("significant");
    });

    it("critical concern for very low skills at 17+", () => {
      const result = analyseIndependence(makeInput({
        age: 17,
        lifeSkills: [
          makeSkill({ level: "not_started" }),
          makeSkill({ level: "emerging" }),
          makeSkill({ level: "not_started" }),
        ],
      }));
      const c = result.concerns.find(c => c.category === "skills");
      expect(c).toBeDefined();
      expect(c!.severity).toBe("critical");
    });

    it("significant concern for no bank account at 16+", () => {
      const result = analyseIndependence(makeInput({ hasBankAccount: false }));
      const c = result.concerns.find(c => c.category === "practical");
      expect(c).toBeDefined();
      expect(c!.severity).toBe("significant");
    });

    it("significant concern for no NI number at 16+", () => {
      const result = analyseIndependence(makeInput({ hasNINumber: false }));
      const c = result.concerns.find(c => c.category === "documentation");
      expect(c).toBeDefined();
      expect(c!.severity).toBe("significant");
    });

    it("moderate concern for no birth certificate", () => {
      const result = analyseIndependence(makeInput({ hasBirthCertificate: false }));
      const c = result.concerns.find(c => c.category === "documentation" && c.description.includes("Birth"));
      expect(c).toBeDefined();
      expect(c!.severity).toBe("moderate");
    });

    it("critical concern for no accommodation at 17+", () => {
      const result = analyseIndependence(makeInput({
        age: 17,
        accommodationPlan: makeAccommodationPlan({ identified: false }),
      }));
      const c = result.concerns.find(c => c.category === "accommodation");
      expect(c).toBeDefined();
      expect(c!.severity).toBe("critical");
    });

    it("significant concern for no personal adviser at 16+", () => {
      const result = analyseIndependence(makeInput({
        pathwayPlan: makePathwayPlan({ personalAdviserAssigned: false }),
      }));
      const c = result.concerns.find(c => c.category === "support");
      expect(c).toBeDefined();
      expect(c!.severity).toBe("significant");
    });

    it("moderate concern for no support network at 15+", () => {
      const result = analyseIndependence(makeInput({
        age: 15,
        hasSupportNetwork: false,
      }));
      const c = result.concerns.find(c => c.category === "relationships");
      expect(c).toBeDefined();
      expect(c!.severity).toBe("moderate");
    });

    it("concern for no skills assessed at 14+", () => {
      const result = analyseIndependence(makeInput({
        age: 14,
        lifeSkills: [],
      }));
      const c = result.concerns.find(c => c.category === "assessment");
      expect(c).toBeDefined();
    });

    it("no concerns for well-prepared young person", () => {
      const result = analyseIndependence(makeInput());
      expect(result.concerns).toHaveLength(0);
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────────

  describe("Strengths", () => {
    it("identifies strong life skills", () => {
      const result = analyseIndependence(makeInput({
        lifeSkills: [
          makeSkill({ level: "competent" }),
          makeSkill({ level: "competent" }),
          makeSkill({ level: "independent" }),
          makeSkill({ level: "competent" }),
          makeSkill({ level: "independent" }),
        ],
      }));
      const s = result.strengths.find(s => s.category === "skills");
      expect(s).toBeDefined();
    });

    it("identifies EET engagement", () => {
      const result = analyseIndependence(makeInput({ eetStatus: "in_education" }));
      const s = result.strengths.find(s => s.category === "eet");
      expect(s).toBeDefined();
      expect(s!.description).toContain("education");
    });

    it("identifies good pathway planning", () => {
      const result = analyseIndependence(makeInput());
      const s = result.strengths.find(s => s.category === "planning");
      expect(s).toBeDefined();
    });

    it("identifies financial preparedness", () => {
      const result = analyseIndependence(makeInput({
        hasBankAccount: true,
        financialLiteracyStarted: true,
      }));
      const s = result.strengths.find(s => s.category === "finance");
      expect(s).toBeDefined();
    });

    it("identifies accommodation planning", () => {
      const result = analyseIndependence(makeInput());
      const s = result.strengths.find(s => s.category === "accommodation");
      expect(s).toBeDefined();
    });

    it("identifies support network mapped", () => {
      const result = analyseIndependence(makeInput({
        hasSupportNetwork: true,
        supportNetworkMapped: true,
      }));
      const s = result.strengths.find(s => s.category === "relationships");
      expect(s).toBeDefined();
    });

    it("identifies all skills at target", () => {
      const result = analyseIndependence(makeInput({
        lifeSkills: [
          makeSkill({ level: "competent", targetLevel: "competent" }),
          makeSkill({ level: "independent", targetLevel: "developing" }),
        ],
      }));
      const s = result.strengths.find(s => s.category === "progress");
      expect(s).toBeDefined();
    });
  });

  // ── Regulatory flags ──────────────────────────────────────────────────

  describe("Regulatory flags", () => {
    it("CHR 2015 Reg 14 met when skills being developed", () => {
      const result = analyseIndependence(makeInput());
      const flag = result.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 14");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("met");
    });

    it("CHR 2015 Reg 14 not_met when no skills tracked", () => {
      const result = analyseIndependence(makeInput({ lifeSkills: [] }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 14");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("not_met");
    });

    it("CHR 2015 Reg 14 partially_met when skills low", () => {
      const result = analyseIndependence(makeInput({
        lifeSkills: [
          makeSkill({ level: "not_started" }),
          makeSkill({ level: "emerging" }),
        ],
      }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 14");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("partially_met");
    });

    it("Children (Leaving Care) Act 2000 met with pathway plan for 16+", () => {
      const result = analyseIndependence(makeInput());
      const flag = result.regulatoryFlags.find(f => f.regulation === "Children (Leaving Care) Act 2000");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("met");
    });

    it("Children (Leaving Care) Act 2000 not_met without pathway plan for 16+", () => {
      const result = analyseIndependence(makeInput({
        pathwayPlan: makePathwayPlan({ exists: false, upToDate: false }),
      }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "Children (Leaving Care) Act 2000");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("not_met");
    });

    it("SCCIF met for well-prepared young person", () => {
      const result = analyseIndependence(makeInput());
      const flag = result.regulatoryFlags.find(f => f.regulation === "SCCIF");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("met");
    });

    it("SCCIF not_met for NEET at 16+", () => {
      const result = analyseIndependence(makeInput({ eetStatus: "neet" }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "SCCIF");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("not_met");
    });

    it("Care Leavers Regs met with personal adviser for 16+", () => {
      const result = analyseIndependence(makeInput());
      const flag = result.regulatoryFlags.find(f => f.regulation === "Care Leavers Regs 2010");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("met");
    });

    it("Care Leavers Regs not_met without personal adviser for 16+", () => {
      const result = analyseIndependence(makeInput({
        pathwayPlan: makePathwayPlan({ personalAdviserAssigned: false }),
      }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "Care Leavers Regs 2010");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("not_met");
    });

    it("no Leaving Care flag for under 16", () => {
      const result = analyseIndependence(makeInput({
        age: 14,
        pathwayPlan: makePathwayPlan({ exists: false }),
      }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "Children (Leaving Care) Act 2000");
      expect(flag).toBeUndefined();
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────

  describe("Recommendations", () => {
    it("recommends pathway plan when missing at 16+", () => {
      const result = analyseIndependence(makeInput({
        pathwayPlan: makePathwayPlan({ exists: false, upToDate: false }),
      }));
      expect(result.recommendations.some(r => r.includes("pathway plan"))).toBe(true);
    });

    it("recommends personal adviser when not assigned", () => {
      const result = analyseIndependence(makeInput({
        pathwayPlan: makePathwayPlan({ personalAdviserAssigned: false }),
      }));
      expect(result.recommendations.some(r => r.includes("personal adviser"))).toBe(true);
    });

    it("recommends EET plan when NEET", () => {
      const result = analyseIndependence(makeInput({ eetStatus: "neet" }));
      expect(result.recommendations.some(r => r.includes("EET"))).toBe(true);
    });

    it("recommends skills assessment when none tracked", () => {
      const result = analyseIndependence(makeInput({
        age: 14,
        lifeSkills: [],
      }));
      expect(result.recommendations.some(r => r.includes("life skills assessment"))).toBe(true);
    });

    it("recommends bank account when missing at 16+", () => {
      const result = analyseIndependence(makeInput({ hasBankAccount: false }));
      expect(result.recommendations.some(r => r.includes("bank account"))).toBe(true);
    });

    it("recommends NI number when missing at 16+", () => {
      const result = analyseIndependence(makeInput({ hasNINumber: false }));
      expect(result.recommendations.some(r => r.includes("National Insurance"))).toBe(true);
    });

    it("recommends birth certificate when missing", () => {
      const result = analyseIndependence(makeInput({ hasBirthCertificate: false }));
      expect(result.recommendations.some(r => r.includes("birth certificate"))).toBe(true);
    });

    it("recommends accommodation planning at 17+ when not identified", () => {
      const result = analyseIndependence(makeInput({
        age: 17,
        accommodationPlan: makeAccommodationPlan({ identified: false }),
      }));
      expect(result.recommendations.some(r => r.includes("accommodation"))).toBe(true);
    });

    it("recommends support network mapping", () => {
      const result = analyseIndependence(makeInput({
        hasSupportNetwork: false,
      }));
      expect(result.recommendations.some(r => r.includes("support network"))).toBe(true);
    });

    it("recommends weakest category focus", () => {
      const result = analyseIndependence(makeInput({
        lifeSkills: [
          makeSkill({ category: "cooking_nutrition", level: "competent" }),
          makeSkill({ category: "budgeting_finance", level: "not_started" }),
        ],
      }));
      expect(result.recommendations.some(r => r.includes("budgeting finance"))).toBe(true);
    });

    it("minimal recommendations for well-prepared YP", () => {
      const result = analyseIndependence(makeInput({
        lifeSkills: [
          makeSkill({ level: "competent", targetLevel: "competent" }),
          makeSkill({ level: "competent", targetLevel: "competent" }),
          makeSkill({ level: "independent", targetLevel: "competent" }),
          makeSkill({ level: "competent", targetLevel: "competent" }),
          makeSkill({ level: "competent", targetLevel: "competent" }),
        ],
      }));
      expect(result.recommendations.length).toBeLessThanOrEqual(1);
    });
  });

  // ── Status descriptions ───────────────────────────────────────────────

  describe("Status descriptions", () => {
    it("pathway plan status — no plan", () => {
      const result = analyseIndependence(makeInput({
        pathwayPlan: makePathwayPlan({ exists: false }),
      }));
      expect(result.pathwayPlanStatus).toContain("No pathway plan");
    });

    it("pathway plan status — not up to date", () => {
      const result = analyseIndependence(makeInput({
        pathwayPlan: makePathwayPlan({ upToDate: false }),
      }));
      expect(result.pathwayPlanStatus).toContain("not up to date");
    });

    it("pathway plan status — current with participation", () => {
      const result = analyseIndependence(makeInput());
      expect(result.pathwayPlanStatus).toContain("current");
      expect(result.pathwayPlanStatus).toContain("participation");
    });

    it("accommodation status — not identified", () => {
      const result = analyseIndependence(makeInput({
        accommodationPlan: makeAccommodationPlan({ identified: false }),
      }));
      expect(result.accommodationStatus).toContain("not yet identified");
    });

    it("accommodation status — identified with transition", () => {
      const result = analyseIndependence(makeInput());
      expect(result.accommodationStatus).toContain("transition planned");
    });
  });

  // ── Summary ───────────────────────────────────────────────────────────

  describe("Summary", () => {
    it("includes child name", () => {
      const result = analyseIndependence(makeInput({ childName: "Jordan" }));
      expect(result.summary).toContain("Jordan");
    });

    it("includes age", () => {
      const result = analyseIndependence(makeInput({ age: 16 }));
      expect(result.summary).toContain("16");
    });

    it("includes rating", () => {
      const result = analyseIndependence(makeInput());
      expect(result.summary).toContain("excellent");
    });

    it("mentions EET status for NEET", () => {
      const result = analyseIndependence(makeInput({ eetStatus: "neet" }));
      expect(result.summary).toContain("NEET");
    });
  });
});
