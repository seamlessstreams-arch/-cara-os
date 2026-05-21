import { describe, it, expect } from "vitest";
import {
  evaluateDomainQuality,
  evaluateModuleCoverage,
  evaluateOfstedAlignment,
  evaluateRiskProfile,
  buildDomainSummaries,
  generateHomeIntelligenceSummary,
  pct,
  getRating,
  getDomainLabel,
  getRatingLabel,
  type ModuleIntelligenceScore,
  type HomeIntelligenceDomain,
  type Rating,
} from "../home-intelligence-engine";

// ── Helpers ──────────────────────────────────────────────────────────────────

function mod(
  overrides: Partial<ModuleIntelligenceScore> = {},
): ModuleIntelligenceScore {
  return {
    moduleId: "mod-1",
    moduleName: "Test Module",
    domain: "child_experiences",
    overallScore: 75,
    rating: "good",
    ...overrides,
  };
}

function fullModuleSet(): ModuleIntelligenceScore[] {
  return [
    // child_experiences (4 modules)
    mod({ moduleId: "children-outcomes", moduleName: "Children Outcomes", domain: "child_experiences", overallScore: 82, rating: "outstanding" }),
    mod({ moduleId: "therapeutic", moduleName: "Therapeutic", domain: "child_experiences", overallScore: 78, rating: "good" }),
    mod({ moduleId: "pocket-money", moduleName: "Pocket Money", domain: "child_experiences", overallScore: 70, rating: "good" }),
    mod({ moduleId: "education", moduleName: "Education", domain: "child_experiences", overallScore: 85, rating: "outstanding" }),
    // safety_protection (4 modules)
    mod({ moduleId: "safeguarding", moduleName: "Safeguarding Oversight", domain: "safety_protection", overallScore: 90, rating: "outstanding" }),
    mod({ moduleId: "child-exploitation", moduleName: "Child Exploitation Prevention", domain: "safety_protection", overallScore: 75, rating: "good" }),
    mod({ moduleId: "escalation", moduleName: "Escalation Intelligence", domain: "safety_protection", overallScore: 72, rating: "good" }),
    mod({ moduleId: "night-monitoring", moduleName: "Night Monitoring", domain: "safety_protection", overallScore: 80, rating: "outstanding" }),
    // leadership_management (4 modules)
    mod({ moduleId: "regulatory", moduleName: "Regulatory", domain: "leadership_management", overallScore: 88, rating: "outstanding" }),
    mod({ moduleId: "reg-self-assessment", moduleName: "Regulatory Self-Assessment", domain: "leadership_management", overallScore: 76, rating: "good" }),
    mod({ moduleId: "quality-ecology", moduleName: "Quality Ecology", domain: "leadership_management", overallScore: 81, rating: "outstanding" }),
    mod({ moduleId: "lessons-learned", moduleName: "Lessons Learned", domain: "leadership_management", overallScore: 74, rating: "good" }),
    // workforce_operations (5 modules)
    mod({ moduleId: "shift-intelligence", moduleName: "Shift Intelligence", domain: "workforce_operations", overallScore: 77, rating: "good" }),
    mod({ moduleId: "filing-cabinet", moduleName: "Filing Cabinet", domain: "workforce_operations", overallScore: 83, rating: "outstanding" }),
    mod({ moduleId: "hr-files", moduleName: "HR Files", domain: "workforce_operations", overallScore: 71, rating: "good" }),
    mod({ moduleId: "multi-agency", moduleName: "Multi-Agency", domain: "workforce_operations", overallScore: 79, rating: "good" }),
    mod({ moduleId: "aria-learning", moduleName: "ARIA Learning", domain: "workforce_operations", overallScore: 68, rating: "good" }),
  ];
}

function weakModuleSet(): ModuleIntelligenceScore[] {
  return [
    mod({ moduleId: "mod-1", moduleName: "Module 1", domain: "child_experiences", overallScore: 30, rating: "inadequate" }),
    mod({ moduleId: "mod-2", moduleName: "Module 2", domain: "safety_protection", overallScore: 25, rating: "inadequate" }),
    mod({ moduleId: "mod-3", moduleName: "Module 3", domain: "leadership_management", overallScore: 35, rating: "inadequate" }),
    mod({ moduleId: "mod-4", moduleName: "Module 4", domain: "workforce_operations", overallScore: 20, rating: "inadequate" }),
  ];
}

function mixedModuleSet(): ModuleIntelligenceScore[] {
  return [
    mod({ moduleId: "mod-1", moduleName: "Module 1", domain: "child_experiences", overallScore: 92, rating: "outstanding" }),
    mod({ moduleId: "mod-2", moduleName: "Module 2", domain: "safety_protection", overallScore: 55, rating: "requires_improvement" }),
    mod({ moduleId: "mod-3", moduleName: "Module 3", domain: "leadership_management", overallScore: 72, rating: "good" }),
    mod({ moduleId: "mod-4", moduleName: "Module 4", domain: "workforce_operations", overallScore: 35, rating: "inadequate" }),
  ];
}

// ── pct helper ──────────────────────────────────────────────────────────────

describe("pct", () => {
  it("computes correct percentage", () => {
    expect(pct(3, 4)).toBe(75);
  });

  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });

  it("handles 100%", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("handles 0 numerator", () => {
    expect(pct(0, 10)).toBe(0);
  });
});

// ── getRating ───────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("returns outstanding for >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });

  it("returns good for >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ── Label functions ─────────────────────────────────────────────────────────

describe("getDomainLabel", () => {
  it("returns correct label for child_experiences", () => {
    expect(getDomainLabel("child_experiences")).toBe("Overall Experiences & Progress of Children");
  });

  it("returns correct label for safety_protection", () => {
    expect(getDomainLabel("safety_protection")).toBe("How Well Children Are Helped & Protected");
  });

  it("returns correct label for leadership_management", () => {
    expect(getDomainLabel("leadership_management")).toBe("Effectiveness of Leaders & Managers");
  });

  it("returns correct label for workforce_operations", () => {
    expect(getDomainLabel("workforce_operations")).toBe("Workforce Development & Operations");
  });
});

describe("getRatingLabel", () => {
  it("returns correct label for each rating", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── Evaluator 1: Domain Quality ─────────────────────────────────────────────

describe("evaluateDomainQuality", () => {
  it("returns all zeros for empty modules", () => {
    const result = evaluateDomainQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.childExperiencesScore).toBe(0);
    expect(result.safetyProtectionScore).toBe(0);
    expect(result.leadershipManagementScore).toBe(0);
    expect(result.workforceOperationsScore).toBe(0);
    expect(result.childExperiencesAvg).toBe(0);
    expect(result.safetyProtectionAvg).toBe(0);
    expect(result.leadershipManagementAvg).toBe(0);
    expect(result.workforceOperationsAvg).toBe(0);
  });

  it("computes domain averages correctly", () => {
    const modules = fullModuleSet();
    const result = evaluateDomainQuality(modules);
    // child_experiences: (82+78+70+85)/4 = 78.75
    expect(result.childExperiencesAvg).toBe(78.8);
    // safety_protection: (90+75+72+80)/4 = 79.25
    expect(result.safetyProtectionAvg).toBe(79.3);
    // leadership: (88+76+81+74)/4 = 79.75
    expect(result.leadershipManagementAvg).toBe(79.8);
    // workforce: (77+83+71+79+68)/5 = 75.6
    expect(result.workforceOperationsAvg).toBe(75.6);
  });

  it("computes weighted domain scores", () => {
    const modules = fullModuleSet();
    const result = evaluateDomainQuality(modules);
    // CE: (78.8/100)*7 = 5.516 → 5.5
    expect(result.childExperiencesScore).toBe(5.5);
    // SP: (79.3/100)*6 = 4.758 → 4.8
    expect(result.safetyProtectionScore).toBe(4.8);
    // LM: (79.8/100)*6 = 4.788 → 4.8
    expect(result.leadershipManagementScore).toBe(4.8);
    // WO: (75.6/100)*6 = 4.536 → 4.5
    expect(result.workforceOperationsScore).toBe(4.5);
  });

  it("caps overall score at 25", () => {
    const maxModules = [
      mod({ domain: "child_experiences", overallScore: 100 }),
      mod({ domain: "safety_protection", overallScore: 100 }),
      mod({ domain: "leadership_management", overallScore: 100 }),
      mod({ domain: "workforce_operations", overallScore: 100 }),
    ];
    const result = evaluateDomainQuality(maxModules);
    expect(result.overallScore).toBe(25);
  });

  it("handles single domain", () => {
    const modules = [
      mod({ domain: "child_experiences", overallScore: 80 }),
      mod({ domain: "child_experiences", overallScore: 60 }),
    ];
    const result = evaluateDomainQuality(modules);
    // CE avg: 70, others: 0
    expect(result.childExperiencesAvg).toBe(70);
    expect(result.safetyProtectionAvg).toBe(0);
    expect(result.leadershipManagementAvg).toBe(0);
    expect(result.workforceOperationsAvg).toBe(0);
    // Score: (70/100)*7 = 4.9
    expect(result.childExperiencesScore).toBe(4.9);
    expect(result.overallScore).toBe(4.9);
  });

  it("handles weak modules", () => {
    const modules = weakModuleSet();
    const result = evaluateDomainQuality(modules);
    // CE: 30/100*7=2.1, SP: 25/100*6=1.5, LM: 35/100*6=2.1, WO: 20/100*6=1.2
    expect(result.overallScore).toBeLessThan(10);
    expect(result.childExperiencesAvg).toBe(30);
    expect(result.safetyProtectionAvg).toBe(25);
  });

  it("floor at 0", () => {
    const modules = [mod({ domain: "child_experiences", overallScore: 0 })];
    const result = evaluateDomainQuality(modules);
    expect(result.overallScore).toBe(0);
  });
});

// ── Evaluator 2: Module Coverage ────────────────────────────────────────────

describe("evaluateModuleCoverage", () => {
  it("returns all zeros for empty modules", () => {
    const result = evaluateModuleCoverage([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalModules).toBe(0);
    expect(result.moduleCoverageRate).toBe(0);
    expect(result.highPerformanceModuleRate).toBe(0);
    expect(result.domainsCovered).toBe(0);
    expect(result.domainCoverageRate).toBe(0);
    expect(result.consistencyScore).toBe(0);
  });

  it("computes coverage rate correctly", () => {
    const modules = fullModuleSet(); // 17 modules
    const result = evaluateModuleCoverage(modules, 17);
    expect(result.totalModules).toBe(17);
    expect(result.expectedModules).toBe(17);
    expect(result.moduleCoverageRate).toBe(100);
  });

  it("computes partial coverage", () => {
    const modules = [
      mod({ domain: "child_experiences", overallScore: 75 }),
      mod({ domain: "safety_protection", overallScore: 80 }),
    ];
    const result = evaluateModuleCoverage(modules, 17);
    expect(result.moduleCoverageRate).toBe(pct(2, 17));
    expect(result.domainsCovered).toBe(2);
    expect(result.domainCoverageRate).toBe(50);
  });

  it("computes high performance module rate", () => {
    const modules = [
      mod({ overallScore: 80, rating: "outstanding" }),
      mod({ overallScore: 65, rating: "good" }),
      mod({ overallScore: 45, rating: "requires_improvement" }),
      mod({ overallScore: 30, rating: "inadequate" }),
    ];
    const result = evaluateModuleCoverage(modules, 17);
    // 2 out of 4 >= 60
    expect(result.highPerformanceModuleRate).toBe(50);
  });

  it("computes full domain coverage", () => {
    const modules = [
      mod({ domain: "child_experiences" }),
      mod({ domain: "safety_protection" }),
      mod({ domain: "leadership_management" }),
      mod({ domain: "workforce_operations" }),
    ];
    const result = evaluateModuleCoverage(modules, 4);
    expect(result.domainsCovered).toBe(4);
    expect(result.domainCoverageRate).toBe(100);
  });

  it("computes consistency score for identical scores", () => {
    const modules = [
      mod({ domain: "child_experiences", overallScore: 75 }),
      mod({ domain: "safety_protection", overallScore: 75 }),
      mod({ domain: "leadership_management", overallScore: 75 }),
      mod({ domain: "workforce_operations", overallScore: 75 }),
    ];
    const result = evaluateModuleCoverage(modules, 4);
    // All same → cv = 0 → consistency = 100
    expect(result.consistencyScore).toBe(100);
  });

  it("computes lower consistency for varied scores", () => {
    const modules = [
      mod({ overallScore: 90 }),
      mod({ overallScore: 20 }),
    ];
    const result = evaluateModuleCoverage(modules, 17);
    // mean = 55, variance = ((90-55)^2 + (20-55)^2)/2 = (1225+1225)/2 = 1225, stdDev = 35, cv = 35/55 ≈ 0.636
    // consistency = max(0, round((1 - 0.636/0.5)*100)) = max(0, round(-27.3)) = 0
    expect(result.consistencyScore).toBe(0);
  });

  it("caps overall score at 25", () => {
    const modules = fullModuleSet();
    const result = evaluateModuleCoverage(modules, 17);
    expect(result.overallScore).toBeLessThanOrEqual(25);
    expect(result.overallScore).toBeGreaterThan(0);
  });

  it("uses default expected module count of 17", () => {
    const modules = [mod()];
    const result = evaluateModuleCoverage(modules);
    expect(result.expectedModules).toBe(17);
  });

  it("caps coverage at expected when more modules than expected", () => {
    const modules = [
      mod({ moduleId: "m1" }),
      mod({ moduleId: "m2" }),
      mod({ moduleId: "m3" }),
    ];
    const result = evaluateModuleCoverage(modules, 2);
    expect(result.moduleCoverageRate).toBe(100);
  });
});

// ── Evaluator 3: Ofsted Alignment ───────────────────────────────────────────

describe("evaluateOfstedAlignment", () => {
  it("returns all false/zero for empty modules", () => {
    const result = evaluateOfstedAlignment([]);
    expect(result.overallScore).toBe(0);
    expect(result.childExperiencesAboveThreshold).toBe(false);
    expect(result.safetyProtectionAboveThreshold).toBe(false);
    expect(result.leadershipAboveThreshold).toBe(false);
    expect(result.workforceAboveThreshold).toBe(false);
    expect(result.noInadequateDomains).toBe(false);
    expect(result.crossDomainConsistency).toBe(false);
    expect(result.allModulesAboveMinimum).toBe(false);
  });

  it("scores max for all-outstanding modules", () => {
    const modules = [
      mod({ domain: "child_experiences", overallScore: 85 }),
      mod({ domain: "safety_protection", overallScore: 82 }),
      mod({ domain: "leadership_management", overallScore: 80 }),
      mod({ domain: "workforce_operations", overallScore: 83 }),
    ];
    const result = evaluateOfstedAlignment(modules);
    expect(result.overallScore).toBe(25); // all 7 booleans true
    expect(result.childExperiencesAboveThreshold).toBe(true);
    expect(result.safetyProtectionAboveThreshold).toBe(true);
    expect(result.leadershipAboveThreshold).toBe(true);
    expect(result.workforceAboveThreshold).toBe(true);
    expect(result.noInadequateDomains).toBe(true);
    expect(result.crossDomainConsistency).toBe(true);
    expect(result.allModulesAboveMinimum).toBe(true);
  });

  it("detects domains below threshold", () => {
    const modules = [
      mod({ domain: "child_experiences", overallScore: 75 }),
      mod({ domain: "safety_protection", overallScore: 50 }),
      mod({ domain: "leadership_management", overallScore: 65 }),
      mod({ domain: "workforce_operations", overallScore: 45 }),
    ];
    const result = evaluateOfstedAlignment(modules);
    expect(result.childExperiencesAboveThreshold).toBe(true);
    expect(result.safetyProtectionAboveThreshold).toBe(false);
    expect(result.leadershipAboveThreshold).toBe(true);
    expect(result.workforceAboveThreshold).toBe(false);
  });

  it("detects inadequate domains", () => {
    const modules = [
      mod({ domain: "child_experiences", overallScore: 35 }),
      mod({ domain: "safety_protection", overallScore: 60 }),
    ];
    const result = evaluateOfstedAlignment(modules);
    expect(result.noInadequateDomains).toBe(false);
  });

  it("detects all domains above inadequate threshold", () => {
    const modules = [
      mod({ domain: "child_experiences", overallScore: 45 }),
      mod({ domain: "safety_protection", overallScore: 50 }),
    ];
    const result = evaluateOfstedAlignment(modules);
    expect(result.noInadequateDomains).toBe(true);
  });

  it("detects cross-domain inconsistency (spread > 25)", () => {
    const modules = [
      mod({ domain: "child_experiences", overallScore: 90 }),
      mod({ domain: "safety_protection", overallScore: 50 }),
    ];
    const result = evaluateOfstedAlignment(modules);
    expect(result.crossDomainConsistency).toBe(false);
  });

  it("detects cross-domain consistency (spread <= 25)", () => {
    const modules = [
      mod({ domain: "child_experiences", overallScore: 70 }),
      mod({ domain: "safety_protection", overallScore: 80 }),
    ];
    const result = evaluateOfstedAlignment(modules);
    expect(result.crossDomainConsistency).toBe(true);
  });

  it("single domain counts as consistent", () => {
    const modules = [mod({ domain: "child_experiences", overallScore: 70 })];
    const result = evaluateOfstedAlignment(modules);
    expect(result.crossDomainConsistency).toBe(true);
  });

  it("detects modules below minimum", () => {
    const modules = [
      mod({ overallScore: 80 }),
      mod({ overallScore: 25 }),
    ];
    const result = evaluateOfstedAlignment(modules);
    expect(result.allModulesAboveMinimum).toBe(false);
  });

  it("all modules above minimum when >= 30", () => {
    const modules = [
      mod({ overallScore: 30 }),
      mod({ overallScore: 80 }),
    ];
    const result = evaluateOfstedAlignment(modules);
    expect(result.allModulesAboveMinimum).toBe(true);
  });

  it("computes correct total score: 4+4+4+4+3+3+3 = 25", () => {
    // All true except crossDomainConsistency
    const modules = [
      mod({ domain: "child_experiences", overallScore: 90 }),
      mod({ domain: "safety_protection", overallScore: 60 }),
      mod({ domain: "leadership_management", overallScore: 65 }),
      mod({ domain: "workforce_operations", overallScore: 62 }),
    ];
    const result = evaluateOfstedAlignment(modules);
    // Spread: 90-60 = 30 > 25 → crossDomainConsistency = false
    // All ≥ 60 → 4 thresholds true (16)
    // All ≥ 40 → noInadequateDomains true (3)
    // All ≥ 30 → allModulesAboveMinimum true (3)
    // crossDomainConsistency false (0)
    // Total: 16 + 3 + 0 + 3 = 22
    expect(result.overallScore).toBe(22);
  });
});

// ── Evaluator 4: Risk Profile ───────────────────────────────────────────────

describe("evaluateRiskProfile", () => {
  it("returns all zeros for empty modules", () => {
    const result = evaluateRiskProfile([]);
    expect(result.overallScore).toBe(0);
    expect(result.inadequateModulesCount).toBe(0);
    expect(result.requiresImprovementModulesCount).toBe(0);
    expect(result.weakestDomainAvg).toBe(0);
    expect(result.weakestDomain).toBeNull();
    expect(result.strongestDomainAvg).toBe(0);
    expect(result.strongestDomain).toBeNull();
    expect(result.domainSpread).toBe(0);
  });

  it("counts inadequate modules", () => {
    const modules = [
      mod({ overallScore: 30, rating: "inadequate" }),
      mod({ overallScore: 35, rating: "inadequate" }),
      mod({ overallScore: 75, rating: "good" }),
    ];
    const result = evaluateRiskProfile(modules);
    expect(result.inadequateModulesCount).toBe(2);
  });

  it("counts requires improvement modules", () => {
    const modules = [
      mod({ overallScore: 45, rating: "requires_improvement" }),
      mod({ overallScore: 55, rating: "requires_improvement" }),
      mod({ overallScore: 75, rating: "good" }),
    ];
    const result = evaluateRiskProfile(modules);
    expect(result.requiresImprovementModulesCount).toBe(2);
  });

  it("identifies weakest and strongest domains", () => {
    const modules = [
      mod({ domain: "child_experiences", overallScore: 90 }),
      mod({ domain: "safety_protection", overallScore: 50 }),
      mod({ domain: "leadership_management", overallScore: 70 }),
    ];
    const result = evaluateRiskProfile(modules);
    expect(result.weakestDomain).toBe("safety_protection");
    expect(result.weakestDomainAvg).toBe(50);
    expect(result.strongestDomain).toBe("child_experiences");
    expect(result.strongestDomainAvg).toBe(90);
    expect(result.domainSpread).toBe(40);
  });

  it("computes high score for no risk modules", () => {
    const modules = fullModuleSet();
    const result = evaluateRiskProfile(modules);
    expect(result.inadequateModulesCount).toBe(0);
    expect(result.requiresImprovementModulesCount).toBe(0);
    // (1-0)*7 + (1-0)*6 + (weakest/100)*6 + (domAbove60/domains)*6
    expect(result.overallScore).toBeGreaterThan(20);
  });

  it("computes low score for all inadequate modules", () => {
    const modules = weakModuleSet();
    const result = evaluateRiskProfile(modules);
    expect(result.inadequateModulesCount).toBe(4);
    // (1-4/4)*7=0 + (1-0)*6=6 + (20/100)*6=1.2 + (0/4)*6=0 → 7.2
    expect(result.overallScore).toBeLessThan(10);
  });

  it("caps overall score at 25", () => {
    const modules = [
      mod({ domain: "child_experiences", overallScore: 100 }),
      mod({ domain: "safety_protection", overallScore: 100 }),
      mod({ domain: "leadership_management", overallScore: 100 }),
      mod({ domain: "workforce_operations", overallScore: 100 }),
    ];
    const result = evaluateRiskProfile(modules);
    // (1-0)*7 + (1-0)*6 + (100/100)*6 + (4/4)*6 = 7+6+6+6 = 25
    expect(result.overallScore).toBe(25);
  });

  it("handles mixed risk levels", () => {
    const modules = mixedModuleSet();
    const result = evaluateRiskProfile(modules);
    expect(result.inadequateModulesCount).toBe(1); // score 35
    expect(result.requiresImprovementModulesCount).toBe(1); // score 55
    expect(result.weakestDomain).toBe("workforce_operations");
    expect(result.strongestDomain).toBe("child_experiences");
  });
});

// ── Build Domain Summaries ──────────────────────────────────────────────────

describe("buildDomainSummaries", () => {
  it("returns 4 domain summaries even with empty input", () => {
    const summaries = buildDomainSummaries([]);
    expect(summaries).toHaveLength(4);
    for (const s of summaries) {
      expect(s.moduleCount).toBe(0);
      expect(s.averageScore).toBe(0);
      expect(s.rating).toBe("inadequate");
      expect(s.highestModule).toBeNull();
      expect(s.lowestModule).toBeNull();
    }
  });

  it("computes correct domain summaries for full set", () => {
    const summaries = buildDomainSummaries(fullModuleSet());
    const ce = summaries.find((s) => s.domain === "child_experiences")!;
    expect(ce.moduleCount).toBe(4);
    expect(ce.averageScore).toBe(78.8); // (82+78+70+85)/4
    expect(ce.rating).toBe("good");
    expect(ce.highestModule?.moduleName).toBe("Education");
    expect(ce.highestModule?.score).toBe(85);
    expect(ce.lowestModule?.moduleName).toBe("Pocket Money");
    expect(ce.lowestModule?.score).toBe(70);
  });

  it("lists modules within each domain", () => {
    const summaries = buildDomainSummaries(fullModuleSet());
    const sp = summaries.find((s) => s.domain === "safety_protection")!;
    expect(sp.modules).toHaveLength(4);
    expect(sp.modules.map((m) => m.moduleId)).toContain("safeguarding");
    expect(sp.modules.map((m) => m.moduleId)).toContain("child-exploitation");
  });

  it("returns correct labels", () => {
    const summaries = buildDomainSummaries([]);
    expect(summaries[0].domainLabel).toBe("Overall Experiences & Progress of Children");
    expect(summaries[1].domainLabel).toBe("How Well Children Are Helped & Protected");
    expect(summaries[2].domainLabel).toBe("Effectiveness of Leaders & Managers");
    expect(summaries[3].domainLabel).toBe("Workforce Development & Operations");
  });

  it("handles single module per domain", () => {
    const modules = [
      mod({ moduleId: "only-one", moduleName: "Only One", domain: "child_experiences", overallScore: 65 }),
    ];
    const summaries = buildDomainSummaries(modules);
    const ce = summaries.find((s) => s.domain === "child_experiences")!;
    expect(ce.moduleCount).toBe(1);
    expect(ce.averageScore).toBe(65);
    expect(ce.highestModule?.moduleId).toBe("only-one");
    expect(ce.lowestModule?.moduleId).toBe("only-one");
  });

  it("orders domains consistently", () => {
    const summaries = buildDomainSummaries(fullModuleSet());
    expect(summaries[0].domain).toBe("child_experiences");
    expect(summaries[1].domain).toBe("safety_protection");
    expect(summaries[2].domain).toBe("leadership_management");
    expect(summaries[3].domain).toBe("workforce_operations");
  });
});

// ── Orchestrator ────────────────────────────────────────────────────────────

describe("generateHomeIntelligenceSummary", () => {
  const baseInput = {
    homeId: "home-oak-house",
    homeName: "Oak House",
    periodStart: "2025-01-01",
    periodEnd: "2025-12-31",
  };

  it("produces complete summary for full module set", () => {
    const result = generateHomeIntelligenceSummary({
      ...baseInput,
      moduleScores: fullModuleSet(),
    });

    expect(result.homeId).toBe("home-oak-house");
    expect(result.homeName).toBe("Oak House");
    expect(result.periodStart).toBe("2025-01-01");
    expect(result.periodEnd).toBe("2025-12-31");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
    expect(result.totalModules).toBe(17);
    expect(result.domainSummaries).toHaveLength(4);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("handles empty modules gracefully", () => {
    const result = generateHomeIntelligenceSummary({
      ...baseInput,
      moduleScores: [],
    });

    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.totalModules).toBe(0);
    expect(result.domainQuality.overallScore).toBe(0);
    expect(result.moduleCoverage.overallScore).toBe(0);
    expect(result.ofstedAlignment.overallScore).toBe(0);
    expect(result.riskProfile.overallScore).toBe(0);
    expect(result.areasForImprovement).toContain("No intelligence module data available — no assessment possible");
    expect(result.actions).toContain("URGENT: No module intelligence data — implement intelligence engines across all care domains");
  });

  it("rates outstanding for all-high modules", () => {
    const modules: ModuleIntelligenceScore[] = [];
    const domains: HomeIntelligenceDomain[] = ["child_experiences", "safety_protection", "leadership_management", "workforce_operations"];
    for (let i = 0; i < 17; i++) {
      modules.push(mod({
        moduleId: `mod-${i}`,
        moduleName: `Module ${i}`,
        domain: domains[i % 4],
        overallScore: 85 + (i % 3),
        rating: "outstanding",
      }));
    }
    const result = generateHomeIntelligenceSummary({
      ...baseInput,
      moduleScores: modules,
      expectedModuleCount: 17,
    });

    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  it("rates inadequate for all-weak modules", () => {
    const result = generateHomeIntelligenceSummary({
      ...baseInput,
      moduleScores: weakModuleSet(),
    });

    expect(result.rating).toBe("inadequate");
    expect(result.overallScore).toBeLessThan(40);
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates correct strengths for good performance", () => {
    const result = generateHomeIntelligenceSummary({
      ...baseInput,
      moduleScores: fullModuleSet(),
    });

    const strengthTexts = result.strengths.join(" ");
    // Should mention positive rating
    expect(result.strengths.some((s) => s.includes("rated"))).toBe(true);
  });

  it("generates correct areas for improvement for mixed performance", () => {
    const result = generateHomeIntelligenceSummary({
      ...baseInput,
      moduleScores: mixedModuleSet(),
    });

    expect(result.areasForImprovement.some((a) => a.includes("Inadequate"))).toBe(true);
  });

  it("generates actions for inadequate modules", () => {
    const modules = [
      mod({ moduleId: "bad-mod", moduleName: "Bad Module", domain: "child_experiences", overallScore: 20, rating: "inadequate" }),
      mod({ domain: "safety_protection", overallScore: 70, rating: "good" }),
    ];
    const result = generateHomeIntelligenceSummary({
      ...baseInput,
      moduleScores: modules,
    });

    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("Bad Module"))).toBe(true);
  });

  it("generates actions for empty domains", () => {
    const modules = [
      mod({ domain: "child_experiences", overallScore: 75 }),
      mod({ domain: "safety_protection", overallScore: 80 }),
    ];
    const result = generateHomeIntelligenceSummary({
      ...baseInput,
      moduleScores: modules,
    });

    // leadership_management and workforce_operations have no modules
    expect(result.actions.some((a) => a.includes("No intelligence coverage"))).toBe(true);
  });

  it("generates action for weakest domain below 60", () => {
    const modules = [
      mod({ domain: "child_experiences", overallScore: 80 }),
      mod({ domain: "safety_protection", overallScore: 45 }),
      mod({ domain: "leadership_management", overallScore: 70 }),
      mod({ domain: "workforce_operations", overallScore: 65 }),
    ];
    const result = generateHomeIntelligenceSummary({
      ...baseInput,
      moduleScores: modules,
    });

    expect(result.actions.some((a) => a.includes("Weakest domain"))).toBe(true);
  });

  it("uses custom expectedModuleCount", () => {
    const modules = [mod(), mod({ moduleId: "m2" })];
    const result = generateHomeIntelligenceSummary({
      ...baseInput,
      moduleScores: modules,
      expectedModuleCount: 2,
    });

    expect(result.moduleCoverage.expectedModules).toBe(2);
    expect(result.moduleCoverage.moduleCoverageRate).toBe(100);
  });

  it("defaults expectedModuleCount to 17", () => {
    const result = generateHomeIntelligenceSummary({
      ...baseInput,
      moduleScores: [mod()],
    });

    expect(result.moduleCoverage.expectedModules).toBe(17);
  });

  it("overall score is sum of 4 evaluators capped at 100", () => {
    const result = generateHomeIntelligenceSummary({
      ...baseInput,
      moduleScores: fullModuleSet(),
    });

    const expected = Math.min(
      100,
      Math.round(
        result.domainQuality.overallScore +
        result.moduleCoverage.overallScore +
        result.ofstedAlignment.overallScore +
        result.riskProfile.overallScore,
      ),
    );
    expect(result.overallScore).toBe(expected);
  });

  it("rating matches overallScore thresholds", () => {
    const result = generateHomeIntelligenceSummary({
      ...baseInput,
      moduleScores: fullModuleSet(),
    });

    expect(result.rating).toBe(getRating(result.overallScore));
  });

  it("always includes regulatory links", () => {
    const result = generateHomeIntelligenceSummary({
      ...baseInput,
      moduleScores: [],
    });

    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.some((r) => r.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("CHR 2015"))).toBe(true);
  });

  it("includes 4 domain summaries always", () => {
    const result = generateHomeIntelligenceSummary({
      ...baseInput,
      moduleScores: [mod({ domain: "child_experiences" })],
    });

    expect(result.domainSummaries).toHaveLength(4);
    const ce = result.domainSummaries.find((d) => d.domain === "child_experiences")!;
    expect(ce.moduleCount).toBe(1);
    const sp = result.domainSummaries.find((d) => d.domain === "safety_protection")!;
    expect(sp.moduleCount).toBe(0);
  });

  it("mentions no immediate actions when all is good", () => {
    const modules: ModuleIntelligenceScore[] = [];
    const domains: HomeIntelligenceDomain[] = ["child_experiences", "safety_protection", "leadership_management", "workforce_operations"];
    for (let i = 0; i < 20; i++) {
      modules.push(mod({
        moduleId: `mod-${i}`,
        moduleName: `Module ${i}`,
        domain: domains[i % 4],
        overallScore: 85,
        rating: "outstanding",
      }));
    }
    const result = generateHomeIntelligenceSummary({
      ...baseInput,
      moduleScores: modules,
      expectedModuleCount: 17,
    });

    expect(result.actions).toContain("No immediate actions required. Home intelligence systems operating within expected standards.");
  });

  it("generates cross-domain inconsistency area for improvement", () => {
    const modules = [
      mod({ domain: "child_experiences", overallScore: 95 }),
      mod({ domain: "safety_protection", overallScore: 45 }),
    ];
    const result = generateHomeIntelligenceSummary({
      ...baseInput,
      moduleScores: modules,
    });

    expect(result.areasForImprovement.some((a) => a.includes("inconsistency"))).toBe(true);
  });

  it("mentions outstanding domains in strengths", () => {
    const modules = [
      mod({ domain: "child_experiences", overallScore: 90 }),
      mod({ domain: "child_experiences", overallScore: 85 }),
      mod({ domain: "safety_protection", overallScore: 70 }),
    ];
    const result = generateHomeIntelligenceSummary({
      ...baseInput,
      moduleScores: modules,
    });

    expect(result.strengths.some((s) => s.includes("Outstanding") && s.includes("Children"))).toBe(true);
  });
});
