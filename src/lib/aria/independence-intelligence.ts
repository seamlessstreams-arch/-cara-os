// ══════════════════════════════════════════════════════════════════════════════
// ARIA Intelligence Engine — Independence & Pathway Planning
//
// Pure deterministic analysis of independence preparation for LAC aged 14+.
// Tracks:
//   - Life skills progress (cooking, budgeting, laundry, transport, etc.)
//   - EET status (Education, Employment, Training)
//   - Pathway plan quality and review compliance
//   - Accommodation planning for leaving care
//   - Financial literacy and bank account
//   - Health self-management readiness
//   - Social networks and support
//
// Regulatory alignment:
//   - CHR 2015 Reg 14 — Preparing for independence
//   - Children (Leaving Care) Act 2000
//   - Care Leavers (England) Regulations 2010
//   - SCCIF — Preparing for adulthood
//
// No AI calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ───────────────────────────────────────────────────────────────────

export type SkillLevel = "not_started" | "emerging" | "developing" | "competent" | "independent";

export interface LifeSkill {
  name: string;
  category: SkillCategory;
  level: SkillLevel;
  lastAssessed?: string;
  targetLevel: SkillLevel;
  notes?: string;
}

export type SkillCategory =
  | "cooking_nutrition"
  | "budgeting_finance"
  | "household_tasks"
  | "personal_care"
  | "transport_travel"
  | "health_management"
  | "relationships_communication"
  | "safety_awareness"
  | "digital_literacy"
  | "tenancy_rights";

export type EETStatus = "in_education" | "in_employment" | "in_training" | "neet" | "neet_with_plan" | "not_applicable";

export interface PathwayPlan {
  exists: boolean;
  upToDate: boolean;
  lastReviewDate?: string;
  nextReviewDue?: string;
  youngPersonParticipated: boolean;
  personalAdviserAssigned: boolean;
  goalsSet: boolean;
  goalsProgress: number; // 0-100
}

export interface AccommodationPlan {
  identified: boolean;
  type?: "staying_put" | "supported_lodgings" | "semi_independent" | "independent" | "other" | "not_yet_planned";
  readinessAssessed: boolean;
  transitionPlanned: boolean;
  emergencyPlanInPlace: boolean;
}

export interface IndependenceInput {
  childId: string;
  childName: string;
  age: number;
  lifeSkills: LifeSkill[];
  eetStatus: EETStatus;
  eetDetail?: string;
  pathwayPlan: PathwayPlan;
  accommodationPlan: AccommodationPlan;
  hasBankAccount: boolean;
  financialLiteracyStarted: boolean;
  hasNINumber: boolean;
  hasBirthCertificate: boolean;
  hasPassportOrID: boolean;
  registeredWithGPIndependently: boolean;
  canManageMedication: boolean;
  hasSupportNetwork: boolean;
  supportNetworkMapped: boolean;
  keyRelationshipsIdentified: boolean;
}

export interface IndependenceAssessment {
  childName: string;
  overallScore: number;
  overallRating: "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate";
  skillsScore: number;
  eetScore: number;
  planningScore: number;
  practicalReadinessScore: number;
  totalSkills: number;
  skillsByCategory: CategorySummary[];
  averageSkillLevel: number; // 0-4 (not_started=0, independent=4)
  skillsAtTarget: number;
  skillsBelowTarget: number;
  eetStatus: EETStatus;
  pathwayPlanStatus: string;
  accommodationStatus: string;
  concerns: IndependenceConcern[];
  strengths: IndependenceStrength[];
  regulatoryFlags: RegulatoryFlag[];
  recommendations: string[];
  summary: string;
}

export interface CategorySummary {
  category: SkillCategory;
  avgLevel: number;
  skillCount: number;
  atTarget: number;
}

export interface IndependenceConcern {
  severity: "critical" | "significant" | "moderate" | "low";
  category: string;
  description: string;
}

export interface IndependenceStrength {
  category: string;
  description: string;
}

export interface RegulatoryFlag {
  regulation: string;
  area: string;
  status: "met" | "partially_met" | "not_met";
  detail: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

const SKILL_LEVEL_VALUES: Record<SkillLevel, number> = {
  not_started: 0,
  emerging: 1,
  developing: 2,
  competent: 3,
  independent: 4,
};

// ── Main Engine ─────────────────────────────────────────────────────────────

export function analyseIndependence(input: IndependenceInput): IndependenceAssessment {
  const { childName, lifeSkills, age } = input;

  // ── Skills analysis ───────────────────────────────────────────────────
  const totalSkills = lifeSkills.length;
  const skillLevels = lifeSkills.map(s => SKILL_LEVEL_VALUES[s.level]);
  const avgSkillLevel = totalSkills > 0
    ? Math.round((skillLevels.reduce((a, b) => a + b, 0) / totalSkills) * 10) / 10
    : 0;

  const skillsAtTarget = lifeSkills.filter(s =>
    SKILL_LEVEL_VALUES[s.level] >= SKILL_LEVEL_VALUES[s.targetLevel]
  ).length;
  const skillsBelowTarget = totalSkills - skillsAtTarget;

  const skillsByCategory = analyseCategories(lifeSkills);

  // ── Scores ────────────────────────────────────────────────────────────
  const skillsScore = scoreSkills(lifeSkills, age);
  const eetScore = scoreEET(input.eetStatus, age);
  const planningScore = scorePlanning(input);
  const practicalReadinessScore = scorePracticalReadiness(input);

  // ── Overall ───────────────────────────────────────────────────────────
  const overallScore = Math.round(
    skillsScore * 0.30 +
    eetScore * 0.25 +
    planningScore * 0.25 +
    practicalReadinessScore * 0.20
  );
  const overallRating = scoreToRating(overallScore);

  // ── Status descriptions ───────────────────────────────────────────────
  const pathwayPlanStatus = describePathwayPlan(input.pathwayPlan);
  const accommodationStatus = describeAccommodation(input.accommodationPlan);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns = identifyConcerns(input, avgSkillLevel, skillsBelowTarget, age);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths = identifyStrengths(input, avgSkillLevel, skillsAtTarget, totalSkills);

  // ── Regulatory flags ──────────────────────────────────────────────────
  const regulatoryFlags = assessRegulatory(input, age);

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations = buildRecommendations(input, skillsByCategory, age);

  // ── Summary ───────────────────────────────────────────────────────────
  const summary = buildSummary(childName, overallRating, avgSkillLevel, input.eetStatus, age);

  return {
    childName,
    overallScore,
    overallRating,
    skillsScore,
    eetScore,
    planningScore,
    practicalReadinessScore,
    totalSkills,
    skillsByCategory,
    averageSkillLevel: avgSkillLevel,
    skillsAtTarget,
    skillsBelowTarget,
    eetStatus: input.eetStatus,
    pathwayPlanStatus,
    accommodationStatus,
    concerns,
    strengths,
    regulatoryFlags,
    recommendations,
    summary,
  };
}

// ── Category Analysis ───────────────────────────────────────────────────────

function analyseCategories(skills: LifeSkill[]): CategorySummary[] {
  const cats: Record<string, LifeSkill[]> = {};
  skills.forEach(s => {
    if (!cats[s.category]) cats[s.category] = [];
    cats[s.category].push(s);
  });

  return Object.entries(cats).map(([category, catSkills]) => {
    const levels = catSkills.map(s => SKILL_LEVEL_VALUES[s.level]);
    const avgLevel = Math.round((levels.reduce((a, b) => a + b, 0) / levels.length) * 10) / 10;
    const atTarget = catSkills.filter(s =>
      SKILL_LEVEL_VALUES[s.level] >= SKILL_LEVEL_VALUES[s.targetLevel]
    ).length;
    return {
      category: category as SkillCategory,
      avgLevel,
      skillCount: catSkills.length,
      atTarget,
    };
  });
}

// ── Scoring ─────────────────────────────────────────────────────────────────

function scoreSkills(skills: LifeSkill[], age: number): number {
  if (skills.length === 0) {
    return age >= 16 ? 10 : 30; // No skills tracked is worse for older YP
  }

  const levels = skills.map(s => SKILL_LEVEL_VALUES[s.level]);
  const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;

  // Age-adjusted expectations
  const expectedLevel = age >= 17 ? 3 : age >= 16 ? 2.5 : age >= 15 ? 2 : 1.5;

  if (avgLevel >= expectedLevel) return 100;
  const deficit = expectedLevel - avgLevel;
  return Math.max(10, Math.round(100 - deficit * 35));
}

function scoreEET(status: EETStatus, age: number): number {
  if (age < 16) {
    return status === "in_education" ? 100 : 70; // under 16 should be in education
  }
  switch (status) {
    case "in_education": return 100;
    case "in_employment": return 100;
    case "in_training": return 90;
    case "neet_with_plan": return 50;
    case "neet": return 20;
    case "not_applicable": return 70;
    default: return 50;
  }
}

function scorePlanning(input: IndependenceInput): number {
  let score = 0;
  const pp = input.pathwayPlan;
  const ap = input.accommodationPlan;

  // Pathway plan (60 points)
  if (pp.exists) score += 15;
  if (pp.upToDate) score += 15;
  if (pp.youngPersonParticipated) score += 10;
  if (pp.personalAdviserAssigned) score += 10;
  if (pp.goalsSet) score += 5;
  if (pp.goalsProgress >= 50) score += 5;

  // Accommodation (40 points)
  if (ap.identified) score += 15;
  if (ap.readinessAssessed) score += 10;
  if (ap.transitionPlanned) score += 10;
  if (ap.emergencyPlanInPlace) score += 5;

  return Math.min(100, score);
}

function scorePracticalReadiness(input: IndependenceInput): number {
  let score = 0;

  if (input.hasBankAccount) score += 15;
  if (input.financialLiteracyStarted) score += 10;
  if (input.hasNINumber) score += 15;
  if (input.hasBirthCertificate) score += 15;
  if (input.hasPassportOrID) score += 10;
  if (input.registeredWithGPIndependently) score += 10;
  if (input.canManageMedication) score += 10;
  if (input.hasSupportNetwork) score += 10;
  if (input.supportNetworkMapped) score += 5;

  return Math.min(100, score);
}

// ── Status Descriptions ─────────────────────────────────────────────────────

function describePathwayPlan(pp: PathwayPlan): string {
  if (!pp.exists) return "No pathway plan in place";
  if (!pp.upToDate) return "Pathway plan exists but not up to date";
  if (!pp.youngPersonParticipated) return "Pathway plan up to date but young person not involved";
  return "Pathway plan current with young person participation";
}

function describeAccommodation(ap: AccommodationPlan): string {
  if (!ap.identified) return "Accommodation not yet identified";
  if (!ap.transitionPlanned) return `${(ap.type ?? "").replace(/_/g, " ")} identified but transition not planned`;
  return `${(ap.type ?? "").replace(/_/g, " ")} — transition planned`;
}

// ── Concerns ────────────────────────────────────────────────────────────────

function identifyConcerns(
  input: IndependenceInput,
  avgLevel: number,
  belowTarget: number,
  age: number,
): IndependenceConcern[] {
  const concerns: IndependenceConcern[] = [];

  // No pathway plan for 16+
  if (age >= 16 && !input.pathwayPlan.exists) {
    concerns.push({
      severity: "critical",
      category: "pathway_plan",
      description: "No pathway plan in place — statutory requirement for 16+",
    });
  } else if (age >= 16 && !input.pathwayPlan.upToDate) {
    concerns.push({
      severity: "significant",
      category: "pathway_plan",
      description: "Pathway plan not up to date",
    });
  }

  // NEET
  if (input.eetStatus === "neet" && age >= 16) {
    concerns.push({
      severity: "critical",
      category: "eet",
      description: "Young person is NEET with no plan in place",
    });
  } else if (input.eetStatus === "neet_with_plan" && age >= 16) {
    concerns.push({
      severity: "significant",
      category: "eet",
      description: "Young person is NEET — plan requires active pursuit",
    });
  }

  // Very low skill level for age
  if (age >= 17 && avgLevel < 2) {
    concerns.push({
      severity: "critical",
      category: "skills",
      description: "Life skills significantly below expected level for age 17+ — independence preparation inadequate",
    });
  } else if (age >= 16 && avgLevel < 1.5) {
    concerns.push({
      severity: "significant",
      category: "skills",
      description: "Life skills below expected level for age — intensive preparation needed",
    });
  }

  // No bank account for 16+
  if (age >= 16 && !input.hasBankAccount) {
    concerns.push({
      severity: "significant",
      category: "practical",
      description: "No bank account — essential for independence",
    });
  }

  // No NI number for 16+
  if (age >= 16 && !input.hasNINumber) {
    concerns.push({
      severity: "significant",
      category: "documentation",
      description: "No National Insurance number — needed for employment",
    });
  }

  // No birth certificate
  if (!input.hasBirthCertificate) {
    concerns.push({
      severity: "moderate",
      category: "documentation",
      description: "Birth certificate not obtained — needed for ID purposes",
    });
  }

  // No accommodation plan for 17+
  if (age >= 17 && !input.accommodationPlan.identified) {
    concerns.push({
      severity: "critical",
      category: "accommodation",
      description: "No accommodation identified for post-18 — urgent planning needed",
    });
  } else if (age >= 16 && !input.accommodationPlan.identified) {
    concerns.push({
      severity: "moderate",
      category: "accommodation",
      description: "Accommodation planning should begin for post-18 transition",
    });
  }

  // No personal adviser
  if (age >= 16 && !input.pathwayPlan.personalAdviserAssigned) {
    concerns.push({
      severity: "significant",
      category: "support",
      description: "No personal adviser assigned — statutory requirement",
    });
  }

  // No support network
  if (!input.hasSupportNetwork && age >= 15) {
    concerns.push({
      severity: "moderate",
      category: "relationships",
      description: "No identified support network for post-care",
    });
  }

  // No skills tracked
  if (input.lifeSkills.length === 0 && age >= 14) {
    concerns.push({
      severity: age >= 16 ? "significant" : "moderate",
      category: "assessment",
      description: "No life skills assessment completed",
    });
  }

  return concerns;
}

// ── Strengths ───────────────────────────────────────────────────────────────

function identifyStrengths(
  input: IndependenceInput,
  avgLevel: number,
  atTarget: number,
  totalSkills: number,
): IndependenceStrength[] {
  const strengths: IndependenceStrength[] = [];

  if (avgLevel >= 3 && totalSkills >= 5) {
    strengths.push({
      category: "skills",
      description: "Strong life skills — demonstrating competence across areas",
    });
  } else if (avgLevel >= 2.5 && totalSkills >= 5) {
    strengths.push({
      category: "skills",
      description: "Good progress in developing life skills",
    });
  }

  if (input.eetStatus === "in_education" || input.eetStatus === "in_employment") {
    strengths.push({
      category: "eet",
      description: `Engaged in ${input.eetStatus === "in_education" ? "education" : "employment"}`,
    });
  }

  if (input.pathwayPlan.exists && input.pathwayPlan.upToDate && input.pathwayPlan.youngPersonParticipated) {
    strengths.push({
      category: "planning",
      description: "Pathway plan current with active young person participation",
    });
  }

  if (input.hasBankAccount && input.financialLiteracyStarted) {
    strengths.push({
      category: "finance",
      description: "Bank account and financial literacy work in progress",
    });
  }

  if (input.accommodationPlan.identified && input.accommodationPlan.transitionPlanned) {
    strengths.push({
      category: "accommodation",
      description: "Post-18 accommodation identified with transition plan",
    });
  }

  if (input.hasSupportNetwork && input.supportNetworkMapped) {
    strengths.push({
      category: "relationships",
      description: "Support network identified and mapped",
    });
  }

  if (totalSkills > 0 && atTarget === totalSkills) {
    strengths.push({
      category: "progress",
      description: "All assessed skills at or above target level",
    });
  }

  return strengths;
}

// ── Regulatory Flags ────────────────────────────────────────────────────────

function assessRegulatory(input: IndependenceInput, age: number): RegulatoryFlag[] {
  const flags: RegulatoryFlag[] = [];

  // CHR 2015 Reg 14 — Independence preparation
  const skillsAdequate = input.lifeSkills.length > 0 &&
    input.lifeSkills.some(s => SKILL_LEVEL_VALUES[s.level] >= 2);
  flags.push({
    regulation: "CHR 2015 Reg 14",
    area: "Independence Preparation",
    status: skillsAdequate ? "met" : input.lifeSkills.length > 0 ? "partially_met" : "not_met",
    detail: skillsAdequate
      ? "Independence skills being actively developed"
      : "Independence preparation insufficient — skills development needed",
  });

  // Children (Leaving Care) Act 2000 — Pathway plan
  if (age >= 16) {
    const ppGood = input.pathwayPlan.exists && input.pathwayPlan.upToDate;
    flags.push({
      regulation: "Children (Leaving Care) Act 2000",
      area: "Pathway Plan",
      status: ppGood ? "met" : input.pathwayPlan.exists ? "partially_met" : "not_met",
      detail: ppGood
        ? "Pathway plan in place and up to date"
        : !input.pathwayPlan.exists
        ? "No pathway plan — statutory requirement"
        : "Pathway plan exists but requires updating",
    });
  }

  // SCCIF — Preparing for adulthood
  const eetOk = input.eetStatus !== "neet";
  const planOk = input.pathwayPlan.exists || age < 16;
  flags.push({
    regulation: "SCCIF",
    area: "Preparing for Adulthood",
    status: (eetOk && planOk && skillsAdequate) ? "met" :
      (!eetOk && age >= 16) ? "not_met" : "partially_met",
    detail: (eetOk && planOk && skillsAdequate)
      ? "Young person being effectively prepared for adulthood"
      : "Gaps in preparation for independence",
  });

  // Care Leavers Regs — Personal adviser
  if (age >= 16) {
    flags.push({
      regulation: "Care Leavers Regs 2010",
      area: "Personal Adviser",
      status: input.pathwayPlan.personalAdviserAssigned ? "met" : "not_met",
      detail: input.pathwayPlan.personalAdviserAssigned
        ? "Personal adviser assigned"
        : "No personal adviser — statutory requirement for eligible young people",
    });
  }

  return flags;
}

// ── Recommendations ─────────────────────────────────────────────────────────

function buildRecommendations(
  input: IndependenceInput,
  categories: CategorySummary[],
  age: number,
): string[] {
  const recs: string[] = [];

  if (age >= 16 && !input.pathwayPlan.exists) {
    recs.push("URGENT: Develop pathway plan — statutory requirement for 16+");
  } else if (input.pathwayPlan.exists && !input.pathwayPlan.upToDate) {
    recs.push("Update pathway plan at next review");
  }

  if (age >= 16 && !input.pathwayPlan.personalAdviserAssigned) {
    recs.push("Assign personal adviser — statutory requirement");
  }

  if (input.eetStatus === "neet") {
    recs.push("PRIORITY: Develop EET plan — explore education, employment, and training options");
  }

  if (input.lifeSkills.length === 0 && age >= 14) {
    recs.push("Complete life skills assessment to identify development areas");
  }

  // Weakest categories
  const weakCategories = categories
    .filter(c => c.avgLevel < 2)
    .sort((a, b) => a.avgLevel - b.avgLevel);
  if (weakCategories.length > 0) {
    const weakest = weakCategories[0];
    recs.push(`Focus on ${weakest.category.replace(/_/g, " ")} skills — currently weakest area`);
  }

  if (age >= 16 && !input.hasBankAccount) {
    recs.push("Open bank account — essential for managing finances independently");
  }

  if (age >= 16 && !input.hasNINumber) {
    recs.push("Apply for National Insurance number");
  }

  if (!input.hasBirthCertificate) {
    recs.push("Obtain birth certificate");
  }

  if (age >= 17 && !input.accommodationPlan.identified) {
    recs.push("URGENT: Begin accommodation planning for post-18 transition");
  }

  if (!input.hasSupportNetwork && age >= 15) {
    recs.push("Map support network — identify people who will support after leaving care");
  }

  if (age >= 16 && !input.registeredWithGPIndependently) {
    recs.push("Support registration with GP in own right");
  }

  return recs;
}

// ── Summary ─────────────────────────────────────────────────────────────────

function buildSummary(
  childName: string,
  rating: string,
  avgLevel: number,
  eet: EETStatus,
  age: number,
): string {
  const levelDesc = avgLevel >= 3 ? "strong skills base" :
    avgLevel >= 2 ? "developing skills" :
    avgLevel > 0 ? "early stages of skill development" : "no skills assessed";

  const eetDesc = eet === "in_education" ? "in education" :
    eet === "in_employment" ? "in employment" :
    eet === "in_training" ? "in training" :
    eet === "neet" ? "NEET" :
    eet === "neet_with_plan" ? "NEET with plan" : "";

  return `${childName} (${age}): Independence rated ${rating.replace(/_/g, " ")}. ${levelDesc}${eetDesc ? `, ${eetDesc}` : ""}.`;
}

// ── Utility ─────────────────────────────────────────────────────────────────

function scoreToRating(score: number): "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate" {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 55) return "adequate";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}
