import { describe, it, expect } from "vitest";
import {
  evaluateLeavingCareQuality,
  evaluateLeavingCareCompliance,
  evaluateLeavingCarePolicy,
  evaluateStaffLeavingCareReadiness,
  buildChildLeavingCareProfiles,
  generateLeavingCareIntelligence,
  pct,
  getRatingIntel,
  getLeavingCareCategoryLabel,
  getLeavingCareOutcomeLabel,
  getLeavingCareRatingLabel,
  type LeavingCareRecord,
  type LeavingCarePolicy,
  type StaffLeavingCareTraining,
  type LeavingCareCategory,
} from "../leaving-care-intelligence-engine";

function rec(overrides: Partial<LeavingCareRecord> = {}): LeavingCareRecord {
  return {
    id: "rec-1", homeId: "home-oak-house", date: "2025-06-15", childId: "child-alex", childName: "Alex",
    category: "pathway_plan_review", outcome: "fully_prepared",
    pathwayPlanReviewed: true, youngPersonConsulted: true, independenceSkillsAssessed: true, transitionPlanInPlace: true,
    documentationComplete: true, timelyRecording: true,
    ...overrides,
  };
}

function fullPolicy(): LeavingCarePolicy {
  return { pathwayPlanningPolicy: true, independenceSkillsFramework: true, accommodationSupportPolicy: true, personalAdvisorPolicy: true, educationEmploymentTransitionPolicy: true, financialCapabilityPolicy: true, stayingPutArrangements: true };
}

function staffMember(overrides: Partial<StaffLeavingCareTraining> = {}): StaffLeavingCareTraining {
  return { staffId: "staff-sarah", pathwayPlanningKnowledge: true, independenceSkillsTeaching: true, transitionSupportSkills: true, benefitsAdviceKnowledge: true, accommodationSupportSkills: true, emotionalSupportSkills: true, ...overrides };
}

const ALL_CATEGORIES: LeavingCareCategory[] = ["pathway_plan_review", "independence_assessment", "accommodation_planning", "personal_advisor_session", "education_employment_support", "health_transition", "financial_capability", "support_network_review"];

// ── pct ─────────────────────────────────────────────────────────────────────

describe("pct", () => {
  it("computes correct percentage", () => { expect(pct(3, 4)).toBe(75); });
  it("returns 0 when den is 0", () => { expect(pct(5, 0)).toBe(0); });
  it("rounds to nearest integer", () => { expect(pct(1, 3)).toBe(33); expect(pct(2, 3)).toBe(67); });
  it("handles 100%", () => { expect(pct(10, 10)).toBe(100); });
  it("handles 0 numerator", () => { expect(pct(0, 10)).toBe(0); });
});

// ── getRatingIntel ──────────────────────────────────────────────────────────

describe("getRatingIntel", () => {
  it("returns outstanding for >= 80", () => { expect(getRatingIntel(80)).toBe("outstanding"); expect(getRatingIntel(100)).toBe("outstanding"); });
  it("returns good for >= 60 and < 80", () => { expect(getRatingIntel(60)).toBe("good"); expect(getRatingIntel(79)).toBe("good"); });
  it("returns requires_improvement for >= 40 and < 60", () => { expect(getRatingIntel(40)).toBe("requires_improvement"); expect(getRatingIntel(59)).toBe("requires_improvement"); });
  it("returns inadequate for < 40", () => { expect(getRatingIntel(0)).toBe("inadequate"); expect(getRatingIntel(39)).toBe("inadequate"); });
});

// ── Label functions ─────────────────────────────────────────────────────────

describe("getLeavingCareCategoryLabel", () => {
  it.each(ALL_CATEGORIES)("returns a label for %s", (cat) => { expect(getLeavingCareCategoryLabel(cat)).toBeTruthy(); });
});

describe("getLeavingCareOutcomeLabel", () => {
  it("returns correct labels", () => {
    expect(getLeavingCareOutcomeLabel("fully_prepared")).toBe("Fully Prepared");
    expect(getLeavingCareOutcomeLabel("not_applicable")).toBe("Not Applicable");
  });
});

describe("getLeavingCareRatingLabel", () => {
  it("returns correct labels", () => {
    expect(getLeavingCareRatingLabel("outstanding")).toBe("Outstanding");
    expect(getLeavingCareRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── Evaluator 1: Quality ────────────────────────────────────────────────────

describe("evaluateLeavingCareQuality", () => {
  it("returns zeros for empty", () => {
    const r = evaluateLeavingCareQuality([]);
    expect(r.overallScore).toBe(0); expect(r.totalRecords).toBe(0);
  });

  it("scores max for all-true", () => {
    const r = evaluateLeavingCareQuality([rec(), rec({ id: "r2" })]);
    expect(r.overallScore).toBe(25); expect(r.totalRecords).toBe(2);
  });

  it("scores 0 for all-false", () => {
    const r = evaluateLeavingCareQuality([rec({ pathwayPlanReviewed: false, youngPersonConsulted: false, independenceSkillsAssessed: false, transitionPlanInPlace: false })]);
    expect(r.overallScore).toBe(0);
  });

  it("weight 7 for pathwayPlanReviewed", () => {
    const r = evaluateLeavingCareQuality([rec({ youngPersonConsulted: false, independenceSkillsAssessed: false, transitionPlanInPlace: false })]);
    expect(r.overallScore).toBe(7);
  });

  it("weight 6 for youngPersonConsulted", () => {
    const r = evaluateLeavingCareQuality([rec({ pathwayPlanReviewed: false, independenceSkillsAssessed: false, transitionPlanInPlace: false })]);
    expect(r.overallScore).toBe(6);
  });

  it("computes mixed rates", () => {
    const records = [rec({ youngPersonConsulted: false }), rec({ id: "r2", pathwayPlanReviewed: false })];
    const r = evaluateLeavingCareQuality(records);
    expect(r.pathwayPlanReviewedRate).toBe(50);
    expect(r.youngPersonConsultedRate).toBe(50);
  });

  it("caps at 25", () => {
    expect(evaluateLeavingCareQuality([rec()]).overallScore).toBeLessThanOrEqual(25);
  });
});

// ── Evaluator 2: Compliance ─────────────────────────────────────────────────

describe("evaluateLeavingCareCompliance", () => {
  it("returns zeros for empty", () => {
    const r = evaluateLeavingCareCompliance([]);
    expect(r.overallScore).toBe(0); expect(r.totalRecords).toBe(0);
    expect(r.categoryDiversityRatio).toBe(0); expect(r.uniqueCategories).toBe(0);
  });

  it("scores max for full diversity + all true", () => {
    const records = ALL_CATEGORIES.map((cat, i) => rec({ id: `r-${i}`, category: cat }));
    const r = evaluateLeavingCareCompliance(records);
    expect(r.overallScore).toBe(25);
    expect(r.uniqueCategories).toBe(8);
    expect(r.categoryDiversityRatio).toBe(1);
  });

  it("computes categoryDiversityRatio correctly", () => {
    const records = [rec({ category: "pathway_plan_review" }), rec({ id: "r2", category: "health_transition" }), rec({ id: "r3", category: "financial_capability" })];
    const r = evaluateLeavingCareCompliance(records);
    expect(r.uniqueCategories).toBe(3);
    expect(r.categoryDiversityRatio).toBe(Math.round((3 / 8) * 100) / 100);
  });

  it("weight 8 for documentationCompleteRate", () => {
    const records = [rec({ timelyRecording: false, pathwayPlanReviewed: false })];
    const r = evaluateLeavingCareCompliance(records);
    expect(r.overallScore).toBeGreaterThanOrEqual(8);
  });

  it("all-false gives near-zero", () => {
    const records = [rec({ documentationComplete: false, timelyRecording: false, pathwayPlanReviewed: false })];
    const r = evaluateLeavingCareCompliance(records);
    expect(r.overallScore).toBeLessThan(1);
  });
});

// ── Evaluator 3: Policy ─────────────────────────────────────────────────────

describe("evaluateLeavingCarePolicy", () => {
  it("returns 0 for null", () => {
    const r = evaluateLeavingCarePolicy(null);
    expect(r.overallScore).toBe(0);
    expect(r.pathwayPlanningPolicy).toBe(false);
  });

  it("scores max for full policy", () => {
    expect(evaluateLeavingCarePolicy(fullPolicy()).overallScore).toBe(25);
  });

  it("scores 0 for all-false", () => {
    expect(evaluateLeavingCarePolicy({ pathwayPlanningPolicy: false, independenceSkillsFramework: false, accommodationSupportPolicy: false, personalAdvisorPolicy: false, educationEmploymentTransitionPolicy: false, financialCapabilityPolicy: false, stayingPutArrangements: false }).overallScore).toBe(0);
  });

  it("weight 4 for pathwayPlanningPolicy", () => {
    const r = evaluateLeavingCarePolicy({ ...fullPolicy(), independenceSkillsFramework: false, accommodationSupportPolicy: false, personalAdvisorPolicy: false, educationEmploymentTransitionPolicy: false, financialCapabilityPolicy: false, stayingPutArrangements: false });
    expect(r.overallScore).toBe(4);
  });

  it("weight 3 for stayingPutArrangements", () => {
    const r = evaluateLeavingCarePolicy({ ...fullPolicy(), pathwayPlanningPolicy: false, independenceSkillsFramework: false, accommodationSupportPolicy: false, personalAdvisorPolicy: false, educationEmploymentTransitionPolicy: false, financialCapabilityPolicy: false });
    expect(r.overallScore).toBe(3);
  });

  it("sums: 4+4+4+4+3+3+3 = 25", () => {
    expect(evaluateLeavingCarePolicy(fullPolicy()).overallScore).toBe(25);
  });

  it("reflects booleans in result", () => {
    const p = { ...fullPolicy(), stayingPutArrangements: false };
    const r = evaluateLeavingCarePolicy(p);
    expect(r.stayingPutArrangements).toBe(false);
    expect(r.pathwayPlanningPolicy).toBe(true);
  });
});

// ── Evaluator 4: Staff Readiness ────────────────────────────────────────────

describe("evaluateStaffLeavingCareReadiness", () => {
  it("returns zeros for empty", () => {
    const r = evaluateStaffLeavingCareReadiness([]);
    expect(r.overallScore).toBe(0); expect(r.totalStaff).toBe(0);
  });

  it("scores max for all-skilled", () => {
    const r = evaluateStaffLeavingCareReadiness([staffMember(), staffMember({ staffId: "s2" })]);
    expect(r.overallScore).toBe(25); expect(r.totalStaff).toBe(2);
  });

  it("scores 0 for all-unskilled", () => {
    const r = evaluateStaffLeavingCareReadiness([staffMember({ pathwayPlanningKnowledge: false, independenceSkillsTeaching: false, transitionSupportSkills: false, benefitsAdviceKnowledge: false, accommodationSupportSkills: false, emotionalSupportSkills: false })]);
    expect(r.overallScore).toBe(0);
  });

  it("weight 6 for pathwayPlanningKnowledge", () => {
    const r = evaluateStaffLeavingCareReadiness([staffMember({ independenceSkillsTeaching: false, transitionSupportSkills: false, benefitsAdviceKnowledge: false, accommodationSupportSkills: false, emotionalSupportSkills: false })]);
    expect(r.overallScore).toBe(6);
  });

  it("weight 2 for emotionalSupportSkills", () => {
    const r = evaluateStaffLeavingCareReadiness([staffMember({ pathwayPlanningKnowledge: false, independenceSkillsTeaching: false, transitionSupportSkills: false, benefitsAdviceKnowledge: false, accommodationSupportSkills: false })]);
    expect(r.overallScore).toBe(2);
  });

  it("computes mixed rates", () => {
    const s = [staffMember({ emotionalSupportSkills: false }), staffMember({ staffId: "s2", pathwayPlanningKnowledge: false, emotionalSupportSkills: false })];
    const r = evaluateStaffLeavingCareReadiness(s);
    expect(r.pathwayPlanningKnowledgeRate).toBe(50);
    expect(r.emotionalSupportSkillsRate).toBe(0);
  });
});

// ── Child Profiles ──────────────────────────────────────────────────────────

describe("buildChildLeavingCareProfiles", () => {
  it("returns empty for no records", () => { expect(buildChildLeavingCareProfiles([])).toEqual([]); });

  it("groups by childId", () => {
    const records = [rec(), rec({ id: "r2", childId: "child-jordan", childName: "Jordan" }), rec({ id: "r3" })];
    const profiles = buildChildLeavingCareProfiles(records);
    expect(profiles).toHaveLength(2);
    expect(profiles.find((p) => p.childId === "child-alex")?.totalRecords).toBe(2);
  });

  it("freq >= 10 → 2", () => {
    const records = Array.from({ length: 10 }, (_, i) => rec({ id: `r-${i}` }));
    const p = buildChildLeavingCareProfiles(records)[0];
    expect(p.overallScore).toBe(8); // freq=2 + rate1=3 + rate2=3 + div=0
  });

  it("freq >= 5 < 10 → 1", () => {
    const records = Array.from({ length: 5 }, (_, i) => rec({ id: `r-${i}` }));
    expect(buildChildLeavingCareProfiles(records)[0].overallScore).toBe(7);
  });

  it("freq < 5 → 0", () => {
    const p = buildChildLeavingCareProfiles([rec()]);
    expect(p[0].overallScore).toBe(6); // freq=0 + rate1=3 + rate2=3 + div=0
  });

  it("diversity >= 4 → 2", () => {
    const records = ALL_CATEGORIES.slice(0, 4).map((cat, i) => rec({ id: `r-${i}`, category: cat }));
    const p = buildChildLeavingCareProfiles(records)[0];
    expect(p.categoriesCovered).toHaveLength(4);
  });

  it("diversity >= 2 < 4 → 1", () => {
    const records = [rec({ category: "pathway_plan_review" }), rec({ id: "r2", category: "health_transition" })];
    const p = buildChildLeavingCareProfiles(records)[0];
    expect(p.categoriesCovered).toHaveLength(2);
  });

  it("caps at 10", () => {
    const records = Array.from({ length: 12 }, (_, i) => rec({ id: `r-${i}`, category: ALL_CATEGORIES[i % 8] }));
    expect(buildChildLeavingCareProfiles(records)[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("scores 0 for all-false", () => {
    const records = [rec({ pathwayPlanReviewed: false, youngPersonConsulted: false })];
    expect(buildChildLeavingCareProfiles(records)[0].overallScore).toBe(0);
  });
});

// ── Orchestrator ────────────────────────────────────────────────────────────

describe("generateLeavingCareIntelligence", () => {
  const base = { homeId: "home-oak-house", periodStart: "2025-01-01", periodEnd: "2025-12-31" };

  it("produces complete report", () => {
    const records = ALL_CATEGORIES.map((cat, i) => rec({ id: `r-${i}`, category: cat, childId: i < 4 ? "child-alex" : "child-jordan", childName: i < 4 ? "Alex" : "Jordan" }));
    const r = generateLeavingCareIntelligence({ ...base, records, policy: fullPolicy(), staff: [staffMember(), staffMember({ staffId: "s2" })] });
    expect(r.homeId).toBe("home-oak-house");
    expect(r.overallScore).toBe(100);
    expect(r.rating).toBe("outstanding");
    expect(r.childProfiles).toHaveLength(2);
    expect(r.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("handles empty data", () => {
    const r = generateLeavingCareIntelligence({ ...base, records: [], policy: null, staff: [] });
    expect(r.overallScore).toBe(0); expect(r.rating).toBe("inadequate");
    expect(r.areasForImprovement.some((a) => a.includes("No leaving care preparation records"))).toBe(true);
    expect(r.actions.some((a) => a.includes("URGENT"))).toBe(true);
  });

  it("filters by period", () => {
    const records = [rec({ date: "2025-06-15" }), rec({ id: "r2", date: "2024-01-01" })];
    const r = generateLeavingCareIntelligence({ ...base, records, policy: fullPolicy(), staff: [staffMember()] });
    expect(r.leavingCareQuality.totalRecords).toBe(1);
  });

  it("score = sum of 4 evaluators capped at 100", () => {
    const records = ALL_CATEGORIES.map((cat, i) => rec({ id: `r-${i}`, category: cat }));
    const r = generateLeavingCareIntelligence({ ...base, records, policy: fullPolicy(), staff: [staffMember()] });
    const expected = Math.min(100, Math.round(r.leavingCareQuality.overallScore + r.leavingCareCompliance.overallScore + r.leavingCarePolicy.overallScore + r.staffReadiness.overallScore));
    expect(r.overallScore).toBe(expected);
  });

  it("rating matches thresholds", () => {
    const records = [rec()];
    const r = generateLeavingCareIntelligence({ ...base, records, policy: fullPolicy(), staff: [staffMember()] });
    expect(r.rating).toBe(getRatingIntel(r.overallScore));
  });

  it("generates no-actions message when all good", () => {
    const records = ALL_CATEGORIES.map((cat, i) => rec({ id: `r-${i}`, category: cat }));
    const r = generateLeavingCareIntelligence({ ...base, records, policy: fullPolicy(), staff: [staffMember()] });
    expect(r.actions).toContain("No immediate actions required. Leaving care preparation operating within expected standards.");
  });

  it("always includes regulatory links", () => {
    const r = generateLeavingCareIntelligence({ ...base, records: [], policy: null, staff: [] });
    expect(r.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 14"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("Leaving Care"))).toBe(true);
  });

  it("generates actions for low pathway review", () => {
    const records = [rec({ pathwayPlanReviewed: false, youngPersonConsulted: false })];
    const r = generateLeavingCareIntelligence({ ...base, records, policy: fullPolicy(), staff: [staffMember()] });
    expect(r.actions.some((a) => a.includes("Pathway plan review rate at 0%"))).toBe(true);
  });

  it("generates action for low score children", () => {
    const records = [rec({ pathwayPlanReviewed: false, youngPersonConsulted: false })];
    const r = generateLeavingCareIntelligence({ ...base, records, policy: fullPolicy(), staff: [staffMember()] });
    expect(r.actions.some((a) => a.includes("young person(s) with low preparation scores"))).toBe(true);
  });
});
