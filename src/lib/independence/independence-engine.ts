// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Independence & Life Skills Engine
//
// Deterministic engine for tracking children's progress toward independence,
// life skills development, and preparation for adulthood/leaving care.
//
// Aligned to:
//   - CHR 2015 Reg 9 — Quality of care (promoting independence)
//   - CHR 2015 Reg 12 — Contact arrangements (maintaining relationships)
//   - Children Act 1989 s.23C — Continuing functions (leaving care)
//   - Children & Social Work Act 2017 — Local offer for care leavers
//   - SCCIF — Children develop skills for independence
//   - Pathway Plan requirements (from age 16)
//
// Key areas:
//   - Daily living skills (cooking, cleaning, laundry, budgeting)
//   - Social & emotional skills (relationships, conflict resolution)
//   - Education & employment readiness
//   - Health management (booking appointments, medication)
//   - Financial literacy (banking, budgeting, benefits)
//   - Housing readiness (tenancy skills, utilities)
//   - Digital skills & online safety
//   - Identity & documentation (passport, NI number, birth cert)
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type SkillDomain =
  | "daily_living"
  | "cooking_nutrition"
  | "money_management"
  | "health_self_care"
  | "education_employment"
  | "relationships_social"
  | "housing_tenancy"
  | "digital_skills"
  | "identity_documents"
  | "travel_transport";

export type SkillLevel = 1 | 2 | 3 | 4 | 5;
// 1 = Not yet started, 2 = Aware/Learning, 3 = Practising with support,
// 4 = Mostly independent, 5 = Fully independent

export type PathwayPlanStatus = "not_required" | "due" | "in_progress" | "current" | "overdue";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface ChildIndependenceProfile {
  childId: string;
  childName: string;
  homeId: string;
  dateOfBirth: string;
  placementStartDate: string;
  expectedLeavingDate?: string;         // planned move-on date
  hasPathwayPlan: boolean;
  pathwayPlanDate?: string;
  pathwayPlanReviewDate?: string;
  personalAdvisorAssigned: boolean;
  personalAdvisorName?: string;
  skillAssessments: SkillAssessment[];
  milestones: IndependenceMilestone[];
  activities: IndependenceActivity[];
  documents: DocumentStatus[];
}

export interface SkillAssessment {
  domain: SkillDomain;
  level: SkillLevel;
  assessedAt: string;
  assessedBy: string;
  targets: string[];
  evidence: string[];
  childSelfRating?: SkillLevel;         // child's own view
  nextReviewDate: string;
}

export interface IndependenceMilestone {
  id: string;
  domain: SkillDomain;
  description: string;
  targetDate: string;
  achievedDate?: string;
  status: "active" | "achieved" | "deferred" | "not_achieved";
  supportNeeded: string;
}

export interface IndependenceActivity {
  id: string;
  domain: SkillDomain;
  description: string;
  date: string;
  duration: number;                     // minutes
  childEngaged: boolean;
  outcomeNotes: string;
  facilitatedBy: string;
}

export interface DocumentStatus {
  type: "passport" | "birth_certificate" | "ni_number" | "bank_account" | "provisional_licence" | "proof_of_address" | "nhs_card";
  obtained: boolean;
  obtainedDate?: string;
  expiryDate?: string;
  notes?: string;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface ChildIndependenceResult {
  childId: string;
  childName: string;
  ageYears: number;
  overallReadiness: number;             // 0-100
  domainScores: DomainScore[];
  pathwayPlanCompliant: boolean;
  pathwayPlanStatus: PathwayPlanStatus;
  milestonesAchieved: number;
  milestonesActive: number;
  milestoneAchievementRate: number;     // %
  activitiesLast30Days: number;
  documentReadiness: number;            // % of key documents obtained
  issues: string[];
  recommendations: string[];
  monthsUntilLeaving?: number;
  readinessForAge: "ahead" | "on_track" | "behind" | "significantly_behind";
}

export interface DomainScore {
  domain: SkillDomain;
  label: string;
  level: SkillLevel;
  levelLabel: string;
  childSelfRating?: SkillLevel;
  targetCount: number;
  activitiesCount: number;
}

export interface HomeIndependenceMetrics {
  homeId: string;
  childCount: number;
  averageReadiness: number;             // 0-100
  pathwayPlanComplianceRate: number;    // %
  activitiesPerChildPerMonth: number;
  averageDocumentReadiness: number;     // %
  milestoneAchievementRate: number;     // %
  childrenRequiringPathwayPlan: number;
  childrenWithPathwayPlan: number;
  domainAverages: { domain: SkillDomain; average: number }[];
  behindChildren: { childId: string; childName: string; readiness: number }[];
  strongestDomains: SkillDomain[];
  weakestDomains: SkillDomain[];
}

// ── Configuration ──────────────────────────────────────────────────────────

const PATHWAY_PLAN_AGE = 16;              // required from age 16
const PATHWAY_PLAN_REVIEW_MONTHS = 6;     // review every 6 months
const DOCUMENT_TYPES_REQUIRED: DocumentStatus["type"][] = [
  "passport", "birth_certificate", "ni_number", "bank_account",
];

const DOMAIN_LABELS: Record<SkillDomain, string> = {
  daily_living: "Daily Living",
  cooking_nutrition: "Cooking & Nutrition",
  money_management: "Money Management",
  health_self_care: "Health & Self-Care",
  education_employment: "Education & Employment",
  relationships_social: "Relationships & Social",
  housing_tenancy: "Housing & Tenancy",
  digital_skills: "Digital Skills",
  identity_documents: "Identity & Documents",
  travel_transport: "Travel & Transport",
};

const LEVEL_LABELS: Record<SkillLevel, string> = {
  1: "Not Started",
  2: "Learning",
  3: "Practising",
  4: "Mostly Independent",
  5: "Fully Independent",
};

// Age-based expectations (minimum level by age)
const AGE_EXPECTATIONS: Record<number, number> = {
  12: 1.5, 13: 2.0, 14: 2.5, 15: 3.0, 16: 3.5, 17: 4.0, 18: 4.5,
};

// ── Core: Evaluate Child Independence ──────────────────────────────────────

export function evaluateChildIndependence(
  profile: ChildIndependenceProfile,
  now?: string,
): ChildIndependenceResult {
  const currentDate = now ? new Date(now) : new Date();
  const currentTime = currentDate.getTime();
  const thirtyDaysAgo = currentTime - 30 * 24 * 60 * 60 * 1000;

  const ageYears = Math.floor(
    (currentTime - new Date(profile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  const issues: string[] = [];
  const recommendations: string[] = [];

  // Domain scores
  const domainScores: DomainScore[] = profile.skillAssessments.map(sa => ({
    domain: sa.domain,
    label: DOMAIN_LABELS[sa.domain] ?? sa.domain,
    level: sa.level,
    levelLabel: LEVEL_LABELS[sa.level] ?? `Level ${sa.level}`,
    childSelfRating: sa.childSelfRating,
    targetCount: sa.targets.length,
    activitiesCount: profile.activities.filter(a => a.domain === sa.domain).length,
  }));

  // Overall readiness (0-100 based on average skill level mapped to %)
  const avgLevel = domainScores.length > 0
    ? domainScores.reduce((sum, d) => sum + d.level, 0) / domainScores.length
    : 1;
  const overallReadiness = Math.round(((avgLevel - 1) / 4) * 100);

  // Pathway Plan compliance
  let pathwayPlanStatus: PathwayPlanStatus = "not_required";
  let pathwayPlanCompliant = true;

  if (ageYears >= PATHWAY_PLAN_AGE) {
    if (!profile.hasPathwayPlan) {
      pathwayPlanStatus = "overdue";
      pathwayPlanCompliant = false;
      issues.push("Pathway Plan required (age 16+) but not in place");
    } else if (profile.pathwayPlanReviewDate) {
      const reviewTime = new Date(profile.pathwayPlanReviewDate).getTime();
      if (reviewTime < currentTime) {
        pathwayPlanStatus = "overdue";
        pathwayPlanCompliant = false;
        issues.push("Pathway Plan overdue for review");
      } else {
        pathwayPlanStatus = "current";
      }
    } else {
      pathwayPlanStatus = "current";
    }
  }

  // Milestones
  const achieved = profile.milestones.filter(m => m.status === "achieved");
  const active = profile.milestones.filter(m => m.status === "active");
  const milestoneAchievementRate = profile.milestones.length > 0
    ? Math.round((achieved.length / profile.milestones.length) * 100)
    : 0;

  // Activities last 30 days
  const activitiesLast30Days = profile.activities.filter(
    a => new Date(a.date).getTime() > thirtyDaysAgo
  ).length;

  // Document readiness
  const requiredDocs = profile.documents.filter(d => DOCUMENT_TYPES_REQUIRED.includes(d.type));
  const obtainedDocs = requiredDocs.filter(d => d.obtained);
  const documentReadiness = requiredDocs.length > 0
    ? Math.round((obtainedDocs.length / requiredDocs.length) * 100)
    : 0;

  // Readiness for age
  const expectedLevel = AGE_EXPECTATIONS[ageYears] ?? (ageYears < 12 ? 1 : 4.5);
  let readinessForAge: "ahead" | "on_track" | "behind" | "significantly_behind" = "on_track";
  if (avgLevel > expectedLevel + 0.5) readinessForAge = "ahead";
  else if (avgLevel < expectedLevel - 1) readinessForAge = "significantly_behind";
  else if (avgLevel < expectedLevel - 0.5) readinessForAge = "behind";

  // Months until leaving
  let monthsUntilLeaving: number | undefined;
  if (profile.expectedLeavingDate) {
    const leavingTime = new Date(profile.expectedLeavingDate).getTime();
    monthsUntilLeaving = Math.max(0, Math.round((leavingTime - currentTime) / (30.44 * 24 * 60 * 60 * 1000)));
  }

  // Generate issues & recommendations
  if (readinessForAge === "behind" || readinessForAge === "significantly_behind") {
    issues.push(`Independence skills ${readinessForAge === "significantly_behind" ? "significantly " : ""}below age expectations`);
    recommendations.push("Increase independence activities frequency");
  }

  if (ageYears >= 16 && documentReadiness < 75) {
    issues.push(`Key documents only ${documentReadiness}% complete (age 16+)`);
    recommendations.push("Prioritise obtaining missing identity documents");
  }

  if (activitiesLast30Days < 2) {
    recommendations.push("Schedule at least 2 independence activities per month");
  }

  if (ageYears >= PATHWAY_PLAN_AGE && !profile.personalAdvisorAssigned) {
    issues.push("No Personal Advisor assigned (required from 16)");
    recommendations.push("Allocate Personal Advisor urgently");
  }

  if (monthsUntilLeaving !== undefined && monthsUntilLeaving < 6 && overallReadiness < 60) {
    issues.push(`Leaving in ${monthsUntilLeaving} months but readiness only ${overallReadiness}%`);
    recommendations.push("Intensive independence preparation needed — consider extending placement");
  }

  // Check for domains with no activities
  const domainsWithoutActivity = domainScores.filter(d => d.activitiesCount === 0 && d.level < 4);
  if (domainsWithoutActivity.length > 0) {
    recommendations.push(`Plan activities for: ${domainsWithoutActivity.map(d => d.label).join(", ")}`);
  }

  return {
    childId: profile.childId,
    childName: profile.childName,
    ageYears,
    overallReadiness,
    domainScores,
    pathwayPlanCompliant,
    pathwayPlanStatus,
    milestonesAchieved: achieved.length,
    milestonesActive: active.length,
    milestoneAchievementRate,
    activitiesLast30Days,
    documentReadiness,
    issues,
    recommendations,
    monthsUntilLeaving,
    readinessForAge,
  };
}

// ── Core: Calculate Home Metrics ────────────────────────────────────────────

export function calculateHomeIndependenceMetrics(
  profiles: ChildIndependenceProfile[],
  homeId: string,
  now?: string,
): HomeIndependenceMetrics {
  const currentDate = now ? new Date(now) : new Date();
  const currentTime = currentDate.getTime();
  const thirtyDaysAgo = currentTime - 30 * 24 * 60 * 60 * 1000;

  const homeProfiles = profiles.filter(p => p.homeId === homeId);

  if (homeProfiles.length === 0) {
    return emptyMetrics(homeId);
  }

  const results = homeProfiles.map(p => evaluateChildIndependence(p, now));

  // Average readiness
  const averageReadiness = Math.round(
    results.reduce((sum, r) => sum + r.overallReadiness, 0) / results.length
  );

  // Pathway plan compliance
  const requirePlan = results.filter(r => r.ageYears >= PATHWAY_PLAN_AGE);
  const havePlan = requirePlan.filter(r => r.pathwayPlanCompliant);
  const pathwayPlanComplianceRate = requirePlan.length > 0
    ? Math.round((havePlan.length / requirePlan.length) * 100)
    : 100;

  // Activities per child per month
  const totalActivities30 = homeProfiles.reduce((sum, p) =>
    sum + p.activities.filter(a => new Date(a.date).getTime() > thirtyDaysAgo).length, 0
  );
  const activitiesPerChildPerMonth = homeProfiles.length > 0
    ? Math.round((totalActivities30 / homeProfiles.length) * 10) / 10
    : 0;

  // Document readiness
  const avgDocReadiness = Math.round(
    results.reduce((sum, r) => sum + r.documentReadiness, 0) / results.length
  );

  // Milestone achievement
  const totalMilestones = homeProfiles.reduce((sum, p) => sum + p.milestones.length, 0);
  const achievedMilestones = homeProfiles.reduce((sum, p) =>
    sum + p.milestones.filter(m => m.status === "achieved").length, 0
  );
  const milestoneAchievementRate = totalMilestones > 0
    ? Math.round((achievedMilestones / totalMilestones) * 100)
    : 0;

  // Domain averages
  const domainTotals = new Map<SkillDomain, { sum: number; count: number }>();
  for (const p of homeProfiles) {
    for (const sa of p.skillAssessments) {
      const current = domainTotals.get(sa.domain) ?? { sum: 0, count: 0 };
      domainTotals.set(sa.domain, { sum: current.sum + sa.level, count: current.count + 1 });
    }
  }
  const domainAverages = Array.from(domainTotals.entries())
    .map(([domain, { sum, count }]) => ({ domain, average: Math.round((sum / count) * 10) / 10 }))
    .sort((a, b) => b.average - a.average);

  const strongestDomains = domainAverages.slice(0, 3).map(d => d.domain);
  const weakestDomains = domainAverages.slice(-3).reverse().map(d => d.domain);

  // Behind children
  const behindChildren = results
    .filter(r => r.readinessForAge === "behind" || r.readinessForAge === "significantly_behind")
    .map(r => ({ childId: r.childId, childName: r.childName, readiness: r.overallReadiness }))
    .sort((a, b) => a.readiness - b.readiness);

  return {
    homeId,
    childCount: homeProfiles.length,
    averageReadiness,
    pathwayPlanComplianceRate,
    activitiesPerChildPerMonth,
    averageDocumentReadiness: avgDocReadiness,
    milestoneAchievementRate,
    childrenRequiringPathwayPlan: requirePlan.length,
    childrenWithPathwayPlan: havePlan.length,
    domainAverages,
    behindChildren,
    strongestDomains,
    weakestDomains,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────

function emptyMetrics(homeId: string): HomeIndependenceMetrics {
  return {
    homeId,
    childCount: 0,
    averageReadiness: 0,
    pathwayPlanComplianceRate: 0,
    activitiesPerChildPerMonth: 0,
    averageDocumentReadiness: 0,
    milestoneAchievementRate: 0,
    childrenRequiringPathwayPlan: 0,
    childrenWithPathwayPlan: 0,
    domainAverages: [],
    behindChildren: [],
    strongestDomains: [],
    weakestDomains: [],
  };
}

export function getDomainLabel(domain: SkillDomain): string {
  return DOMAIN_LABELS[domain] ?? domain.replace(/_/g, " ");
}

export function getLevelLabel(level: SkillLevel): string {
  return LEVEL_LABELS[level] ?? `Level ${level}`;
}
