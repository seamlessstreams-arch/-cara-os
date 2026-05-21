/* ──────────────────────────────────────────────────────────────
   Home Intelligence Summary Engine

   Meta-aggregation engine that synthesises intelligence scores
   from all individual domain engines into a single Ofsted-ready
   home-level intelligence summary.  Groups module scores into
   four SCCIF-aligned judgement domains, computes weighted domain
   averages, evaluates cross-domain consistency, module coverage,
   Ofsted alignment thresholds, and risk profiles.

   Regulatory basis:
     - SCCIF — Social Care Common Inspection Framework
     - CHR 2015 Reg 13 — Leadership & management standard
     - Ofsted inspection handbook — children's homes
     - Quality Standards 2015 — All standards
     - Children Act 1989 — General welfare duty

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

// ── Types ──────────────────────────────────────────────────────────────────

export type HomeIntelligenceDomain =
  | "child_experiences"
  | "safety_protection"
  | "leadership_management"
  | "workforce_operations";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const domainLabels: Record<HomeIntelligenceDomain, string> = {
  child_experiences: "Overall Experiences & Progress of Children",
  safety_protection: "How Well Children Are Helped & Protected",
  leadership_management: "Effectiveness of Leaders & Managers",
  workforce_operations: "Workforce Development & Operations",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getDomainLabel(domain: HomeIntelligenceDomain): string {
  return domainLabels[domain];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface ModuleIntelligenceScore {
  moduleId: string;
  moduleName: string;
  domain: HomeIntelligenceDomain;
  overallScore: number; // 0-100
  rating: Rating;
}

export interface DomainSummary {
  domain: HomeIntelligenceDomain;
  domainLabel: string;
  averageScore: number;
  rating: Rating;
  moduleCount: number;
  modules: { moduleId: string; moduleName: string; score: number; rating: Rating }[];
  highestModule: { moduleId: string; moduleName: string; score: number } | null;
  lowestModule: { moduleId: string; moduleName: string; score: number } | null;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface DomainQualityResult {
  overallScore: number;
  childExperiencesScore: number;
  safetyProtectionScore: number;
  leadershipManagementScore: number;
  workforceOperationsScore: number;
  childExperiencesAvg: number;
  safetyProtectionAvg: number;
  leadershipManagementAvg: number;
  workforceOperationsAvg: number;
}

export interface ModuleCoverageResult {
  overallScore: number;
  totalModules: number;
  expectedModules: number;
  moduleCoverageRate: number;
  highPerformanceModuleRate: number;
  domainsCovered: number;
  domainCoverageRate: number;
  consistencyScore: number;
}

export interface OfstedAlignmentResult {
  overallScore: number;
  childExperiencesAboveThreshold: boolean;
  safetyProtectionAboveThreshold: boolean;
  leadershipAboveThreshold: boolean;
  workforceAboveThreshold: boolean;
  noInadequateDomains: boolean;
  crossDomainConsistency: boolean;
  allModulesAboveMinimum: boolean;
}

export interface RiskProfileResult {
  overallScore: number;
  inadequateModulesCount: number;
  requiresImprovementModulesCount: number;
  weakestDomainAvg: number;
  weakestDomain: HomeIntelligenceDomain | null;
  strongestDomainAvg: number;
  strongestDomain: HomeIntelligenceDomain | null;
  domainSpread: number;
}

export interface HomeIntelligenceSummary {
  homeId: string;
  homeName: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  domainQuality: DomainQualityResult;
  moduleCoverage: ModuleCoverageResult;
  ofstedAlignment: OfstedAlignmentResult;
  riskProfile: RiskProfileResult;
  domainSummaries: DomainSummary[];
  totalModules: number;
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

function domainAverage(modules: ModuleIntelligenceScore[]): number {
  if (modules.length === 0) return 0;
  const sum = modules.reduce((s, m) => s + m.overallScore, 0);
  return Math.round((sum / modules.length) * 10) / 10;
}

function groupByDomain(
  modules: ModuleIntelligenceScore[],
): Map<HomeIntelligenceDomain, ModuleIntelligenceScore[]> {
  const map = new Map<HomeIntelligenceDomain, ModuleIntelligenceScore[]>();
  for (const m of modules) {
    if (!map.has(m.domain)) map.set(m.domain, []);
    map.get(m.domain)!.push(m);
  }
  return map;
}

// ── Evaluator 1: Domain Quality (0-25) ─────────────────────────────────────

export function evaluateDomainQuality(
  modules: ModuleIntelligenceScore[],
): DomainQualityResult {
  if (modules.length === 0) {
    return {
      overallScore: 0,
      childExperiencesScore: 0,
      safetyProtectionScore: 0,
      leadershipManagementScore: 0,
      workforceOperationsScore: 0,
      childExperiencesAvg: 0,
      safetyProtectionAvg: 0,
      leadershipManagementAvg: 0,
      workforceOperationsAvg: 0,
    };
  }

  const grouped = groupByDomain(modules);
  const childExperiencesAvg = domainAverage(grouped.get("child_experiences") ?? []);
  const safetyProtectionAvg = domainAverage(grouped.get("safety_protection") ?? []);
  const leadershipManagementAvg = domainAverage(grouped.get("leadership_management") ?? []);
  const workforceOperationsAvg = domainAverage(grouped.get("workforce_operations") ?? []);

  // Weighted: child_experiences(7) + safety(6) + leadership(6) + workforce(6) = 25
  const childExperiencesScore = Math.round(((childExperiencesAvg / 100) * 7) * 10) / 10;
  const safetyProtectionScore = Math.round(((safetyProtectionAvg / 100) * 6) * 10) / 10;
  const leadershipManagementScore = Math.round(((leadershipManagementAvg / 100) * 6) * 10) / 10;
  const workforceOperationsScore = Math.round(((workforceOperationsAvg / 100) * 6) * 10) / 10;

  let score = childExperiencesScore + safetyProtectionScore + leadershipManagementScore + workforceOperationsScore;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return {
    overallScore: score,
    childExperiencesScore,
    safetyProtectionScore,
    leadershipManagementScore,
    workforceOperationsScore,
    childExperiencesAvg,
    safetyProtectionAvg,
    leadershipManagementAvg,
    workforceOperationsAvg,
  };
}

// ── Evaluator 2: Module Coverage (0-25) ────────────────────────────────────

export function evaluateModuleCoverage(
  modules: ModuleIntelligenceScore[],
  expectedModuleCount: number = 17,
): ModuleCoverageResult {
  const totalModules = modules.length;

  if (totalModules === 0) {
    return {
      overallScore: 0,
      totalModules: 0,
      expectedModules: expectedModuleCount,
      moduleCoverageRate: 0,
      highPerformanceModuleRate: 0,
      domainsCovered: 0,
      domainCoverageRate: 0,
      consistencyScore: 0,
    };
  }

  const moduleCoverageRate = pct(Math.min(totalModules, expectedModuleCount), expectedModuleCount);
  const highPerformanceCount = modules.filter((m) => m.overallScore >= 60).length;
  const highPerformanceModuleRate = pct(highPerformanceCount, totalModules);

  const grouped = groupByDomain(modules);
  const domainsCovered = grouped.size;
  const domainCoverageRate = pct(domainsCovered, 4);

  // Consistency: inverse of coefficient of variation (lower spread = higher score)
  const scores = modules.map((m) => m.overallScore);
  const mean = scores.reduce((s, v) => s + v, 0) / scores.length;
  let cv = 0;
  if (mean > 0) {
    const variance = scores.reduce((s, v) => s + (v - mean) ** 2, 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    cv = stdDev / mean;
  }
  // cv = 0 means perfect consistency (score 100), cv ≥ 0.5 means poor (score 0)
  const consistencyPct = Math.max(0, Math.min(100, Math.round((1 - cv / 0.5) * 100)));

  // Weighted: coverage(8) + highPerf(7) + domainCoverage(5) + consistency(5) = 25
  let score = 0;
  score += (moduleCoverageRate / 100) * 8;
  score += (highPerformanceModuleRate / 100) * 7;
  score += (domainCoverageRate / 100) * 5;
  score += (consistencyPct / 100) * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return {
    overallScore: score,
    totalModules,
    expectedModules: expectedModuleCount,
    moduleCoverageRate,
    highPerformanceModuleRate,
    domainsCovered,
    domainCoverageRate,
    consistencyScore: consistencyPct,
  };
}

// ── Evaluator 3: Ofsted Alignment (0-25) ──────────────────────────────────

export function evaluateOfstedAlignment(
  modules: ModuleIntelligenceScore[],
): OfstedAlignmentResult {
  if (modules.length === 0) {
    return {
      overallScore: 0,
      childExperiencesAboveThreshold: false,
      safetyProtectionAboveThreshold: false,
      leadershipAboveThreshold: false,
      workforceAboveThreshold: false,
      noInadequateDomains: false,
      crossDomainConsistency: false,
      allModulesAboveMinimum: false,
    };
  }

  const grouped = groupByDomain(modules);
  const domainAvgs: { domain: HomeIntelligenceDomain; avg: number }[] = [];

  const ceAvg = domainAverage(grouped.get("child_experiences") ?? []);
  const spAvg = domainAverage(grouped.get("safety_protection") ?? []);
  const lmAvg = domainAverage(grouped.get("leadership_management") ?? []);
  const woAvg = domainAverage(grouped.get("workforce_operations") ?? []);

  if (grouped.has("child_experiences")) domainAvgs.push({ domain: "child_experiences", avg: ceAvg });
  if (grouped.has("safety_protection")) domainAvgs.push({ domain: "safety_protection", avg: spAvg });
  if (grouped.has("leadership_management")) domainAvgs.push({ domain: "leadership_management", avg: lmAvg });
  if (grouped.has("workforce_operations")) domainAvgs.push({ domain: "workforce_operations", avg: woAvg });

  const childExperiencesAboveThreshold = ceAvg >= 60;
  const safetyProtectionAboveThreshold = spAvg >= 60;
  const leadershipAboveThreshold = lmAvg >= 60;
  const workforceAboveThreshold = woAvg >= 60;

  const noInadequateDomains = domainAvgs.every((d) => d.avg >= 40);

  // Cross-domain consistency: max - min spread ≤ 25
  let crossDomainConsistency = false;
  if (domainAvgs.length >= 2) {
    const avgs = domainAvgs.map((d) => d.avg);
    const spread = Math.max(...avgs) - Math.min(...avgs);
    crossDomainConsistency = spread <= 25;
  } else if (domainAvgs.length === 1) {
    crossDomainConsistency = true;
  }

  const allModulesAboveMinimum = modules.every((m) => m.overallScore >= 30);

  // Boolean scoring: 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (childExperiencesAboveThreshold) score += 4;
  if (safetyProtectionAboveThreshold) score += 4;
  if (leadershipAboveThreshold) score += 4;
  if (workforceAboveThreshold) score += 4;
  if (noInadequateDomains) score += 3;
  if (crossDomainConsistency) score += 3;
  if (allModulesAboveMinimum) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    childExperiencesAboveThreshold,
    safetyProtectionAboveThreshold,
    leadershipAboveThreshold,
    workforceAboveThreshold,
    noInadequateDomains,
    crossDomainConsistency,
    allModulesAboveMinimum,
  };
}

// ── Evaluator 4: Risk Profile (0-25) ──────────────────────────────────────

export function evaluateRiskProfile(
  modules: ModuleIntelligenceScore[],
): RiskProfileResult {
  const n = modules.length;

  if (n === 0) {
    return {
      overallScore: 0,
      inadequateModulesCount: 0,
      requiresImprovementModulesCount: 0,
      weakestDomainAvg: 0,
      weakestDomain: null,
      strongestDomainAvg: 0,
      strongestDomain: null,
      domainSpread: 0,
    };
  }

  const inadequateModulesCount = modules.filter((m) => m.overallScore < 40).length;
  const requiresImprovementModulesCount = modules.filter((m) => m.overallScore >= 40 && m.overallScore < 60).length;

  const grouped = groupByDomain(modules);
  const domainAvgs: { domain: HomeIntelligenceDomain; avg: number }[] = [];
  for (const [domain, mods] of grouped.entries()) {
    domainAvgs.push({ domain, avg: domainAverage(mods) });
  }
  domainAvgs.sort((a, b) => a.avg - b.avg);

  const weakest = domainAvgs[0] ?? null;
  const strongest = domainAvgs[domainAvgs.length - 1] ?? null;
  const weakestDomainAvg = weakest?.avg ?? 0;
  const weakestDomain = weakest?.domain ?? null;
  const strongestDomainAvg = strongest?.avg ?? 0;
  const strongestDomain = strongest?.domain ?? null;
  const domainSpread = strongestDomainAvg - weakestDomainAvg;

  // Weighted:
  // inadequatePenalty(7): (1 - inadequateCount/total) * 7
  // riPenalty(6): (1 - riCount/total) * 6
  // weakestDomainLift(6): weakestDomainAvg/100 * 6
  // actionPlanViability(6): domainsAbove60 / totalDomains * 6
  const inadequateRate = n > 0 ? inadequateModulesCount / n : 0;
  const riRate = n > 0 ? requiresImprovementModulesCount / n : 0;
  const domainsAbove60 = domainAvgs.filter((d) => d.avg >= 60).length;
  const totalDomains = domainAvgs.length;

  let score = 0;
  score += (1 - inadequateRate) * 7;
  score += (1 - riRate) * 6;
  score += (weakestDomainAvg / 100) * 6;
  score += totalDomains > 0 ? (domainsAbove60 / totalDomains) * 6 : 0;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return {
    overallScore: score,
    inadequateModulesCount,
    requiresImprovementModulesCount,
    weakestDomainAvg,
    weakestDomain,
    strongestDomainAvg,
    strongestDomain,
    domainSpread,
  };
}

// ── Build Domain Summaries ────────────────────────────────────────────────

export function buildDomainSummaries(
  modules: ModuleIntelligenceScore[],
): DomainSummary[] {
  const allDomains: HomeIntelligenceDomain[] = [
    "child_experiences",
    "safety_protection",
    "leadership_management",
    "workforce_operations",
  ];

  const grouped = groupByDomain(modules);

  return allDomains.map((domain) => {
    const domainModules = grouped.get(domain) ?? [];
    const averageScore = domainAverage(domainModules);
    const rating = getRating(averageScore);

    const moduleList = domainModules.map((m) => ({
      moduleId: m.moduleId,
      moduleName: m.moduleName,
      score: m.overallScore,
      rating: m.rating,
    }));

    const sorted = [...domainModules].sort((a, b) => a.overallScore - b.overallScore);
    const lowestModule = sorted.length > 0
      ? { moduleId: sorted[0].moduleId, moduleName: sorted[0].moduleName, score: sorted[0].overallScore }
      : null;
    const highestModule = sorted.length > 0
      ? { moduleId: sorted[sorted.length - 1].moduleId, moduleName: sorted[sorted.length - 1].moduleName, score: sorted[sorted.length - 1].overallScore }
      : null;

    return {
      domain,
      domainLabel: domainLabels[domain],
      averageScore,
      rating,
      moduleCount: domainModules.length,
      modules: moduleList,
      highestModule,
      lowestModule,
    };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export interface GenerateHomeIntelligenceSummaryInput {
  homeId: string;
  homeName: string;
  periodStart: string;
  periodEnd: string;
  moduleScores: ModuleIntelligenceScore[];
  expectedModuleCount?: number;
}

export function generateHomeIntelligenceSummary(
  input: GenerateHomeIntelligenceSummaryInput,
): HomeIntelligenceSummary {
  const {
    homeId,
    homeName,
    periodStart,
    periodEnd,
    moduleScores,
    expectedModuleCount = 17,
  } = input;

  const domainQuality = evaluateDomainQuality(moduleScores);
  const moduleCoverage = evaluateModuleCoverage(moduleScores, expectedModuleCount);
  const ofstedAlignment = evaluateOfstedAlignment(moduleScores);
  const riskProfile = evaluateRiskProfile(moduleScores);

  const domainSummaries = buildDomainSummaries(moduleScores);

  const rawScore =
    domainQuality.overallScore +
    moduleCoverage.overallScore +
    ofstedAlignment.overallScore +
    riskProfile.overallScore;
  const overallScore = Math.min(100, Math.round(rawScore));
  const rating = getRating(overallScore);

  // ── Strengths ──
  const strengths: string[] = [];
  if (overallScore >= 80) strengths.push("Home intelligence rated Outstanding (" + overallScore + "/100)");
  else if (overallScore >= 60) strengths.push("Home intelligence rated Good (" + overallScore + "/100)");
  if (domainQuality.overallScore >= 20) strengths.push("Domain quality scores are strong (" + domainQuality.overallScore + "/25)");
  if (moduleCoverage.overallScore >= 20) strengths.push("Module coverage is comprehensive (" + moduleCoverage.overallScore + "/25)");
  if (ofstedAlignment.overallScore >= 20) strengths.push("Strong Ofsted alignment across domains (" + ofstedAlignment.overallScore + "/25)");
  if (riskProfile.overallScore >= 20) strengths.push("Low risk profile across all areas (" + riskProfile.overallScore + "/25)");
  if (moduleCoverage.highPerformanceModuleRate >= 90) strengths.push(moduleCoverage.highPerformanceModuleRate + "% of modules rated Good or Outstanding");
  if (ofstedAlignment.crossDomainConsistency) strengths.push("Good cross-domain consistency — no significant gaps between SCCIF judgement areas");

  const strongDomains = domainSummaries.filter((d) => d.averageScore >= 80 && d.moduleCount > 0);
  for (const d of strongDomains) {
    strengths.push(d.domainLabel + " rated Outstanding (" + d.averageScore + "/100)");
  }

  // ── Areas for Improvement ──
  const areasForImprovement: string[] = [];
  if (overallScore < 40) areasForImprovement.push("Home intelligence rated Inadequate (" + overallScore + "/100) — urgent comprehensive review required");
  else if (overallScore < 60) areasForImprovement.push("Home intelligence Requires Improvement (" + overallScore + "/100)");
  if (domainQuality.overallScore < 15) areasForImprovement.push("Domain quality scores need improvement (" + domainQuality.overallScore + "/25)");
  if (moduleCoverage.moduleCoverageRate < 80) areasForImprovement.push("Module coverage at " + moduleCoverage.moduleCoverageRate + "% — intelligence gaps exist");
  if (riskProfile.inadequateModulesCount > 0) areasForImprovement.push(riskProfile.inadequateModulesCount + " module(s) rated Inadequate — immediate intervention required");
  if (riskProfile.requiresImprovementModulesCount > 0) areasForImprovement.push(riskProfile.requiresImprovementModulesCount + " module(s) Require Improvement");
  if (!ofstedAlignment.crossDomainConsistency && moduleScores.length > 0) areasForImprovement.push("Cross-domain spread of " + Math.round(riskProfile.domainSpread) + " points — significant inconsistency across judgement areas");

  const weakDomains = domainSummaries.filter((d) => d.averageScore < 40 && d.moduleCount > 0);
  for (const d of weakDomains) {
    areasForImprovement.push(d.domainLabel + " rated Inadequate (" + d.averageScore + "/100) — urgent action needed");
  }

  if (moduleScores.length === 0) areasForImprovement.push("No intelligence module data available — no assessment possible");

  // ── Actions ──
  const actions: string[] = [];
  if (moduleScores.length === 0) {
    actions.push("URGENT: No module intelligence data — implement intelligence engines across all care domains");
  } else {
    if (riskProfile.inadequateModulesCount > 0) {
      const inadequateModules = moduleScores.filter((m) => m.overallScore < 40);
      for (const m of inadequateModules) {
        actions.push("URGENT: " + m.moduleName + " rated Inadequate (" + m.overallScore + "/100) — requires immediate remediation plan");
      }
    }

    const emptyDomains = domainSummaries.filter((d) => d.moduleCount === 0);
    for (const d of emptyDomains) {
      actions.push("HIGH: No intelligence coverage for " + d.domainLabel + " — implement domain engines");
    }

    if (riskProfile.weakestDomain && riskProfile.weakestDomainAvg < 60) {
      actions.push("HIGH: Weakest domain is " + domainLabels[riskProfile.weakestDomain] + " at " + riskProfile.weakestDomainAvg + "/100 — prioritise improvement");
    }

    if (moduleCoverage.consistencyScore < 50) {
      actions.push("MEDIUM: Score consistency at " + moduleCoverage.consistencyScore + "% — address variation across modules");
    }

    if (riskProfile.requiresImprovementModulesCount > 3) {
      actions.push("MEDIUM: " + riskProfile.requiresImprovementModulesCount + " modules Require Improvement — develop targeted action plans");
    }

    if (moduleCoverage.moduleCoverageRate < 60) {
      actions.push("MEDIUM: Only " + moduleCoverage.moduleCoverageRate + "% module coverage — expand intelligence engine adoption");
    }
  }

  if (actions.length === 0) {
    actions.push("No immediate actions required. Home intelligence systems operating within expected standards.");
  }

  const regulatoryLinks: string[] = [
    "SCCIF — Social Care Common Inspection Framework",
    "CHR 2015 Reg 13 — Leadership and management",
    "Quality Standards 2015 — All standards",
    "Children Act 1989 — General welfare duty",
    "Ofsted inspection handbook — Children's homes",
    "CHR 2015 Reg 35 — Behaviour management",
    "CHR 2015 Reg 12 — Protection of children standard",
  ];

  return {
    homeId,
    homeName,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    domainQuality,
    moduleCoverage,
    ofstedAlignment,
    riskProfile,
    domainSummaries,
    totalModules: moduleScores.length,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
