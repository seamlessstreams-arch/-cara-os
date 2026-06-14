// ══════════════════════════════════════════════════════════════════════════════
// Cara Intelligence Engine — Activities & Enrichment
//
// Pure deterministic analysis of activity participation and enrichment for LAC.
// Tracks:
//   - Activity frequency and variety
//   - Enrichment breadth (categories: sport, creative, social, cultural, etc.)
//   - Achievements and progression
//   - Peer interactions in activities
//   - Child choice and engagement
//   - Community integration
//
// Regulatory alignment:
//   - CHR 2015 Reg 9 — Enjoyment and achievement
//   - CHR 2015 Reg 7 — Activities and recreation
//   - SCCIF — Experiences and progress
//   - UN CRC Art 31 — Right to play
//
// No AI calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ───────────────────────────────────────────────────────────────────

export type ActivityCategory =
  | "sport"
  | "creative_arts"
  | "music"
  | "outdoor"
  | "social"
  | "cultural"
  | "educational"
  | "community"
  | "life_skills"
  | "digital"
  | "other";

export interface Activity {
  id: string;
  date: string;
  name: string;
  category: ActivityCategory;
  duration: number; // minutes
  childChose: boolean;
  childEngagement: "high" | "moderate" | "low" | "refused";
  communityBased: boolean; // outside the home, in the community
  peerInteraction: boolean; // involves non-LAC peers
  achievementNoted?: string;
  recurring: boolean; // regular club/group vs one-off
  supervisedOnly: boolean; // only with staff (no independent participation)
}

export interface ActivityInput {
  childId: string;
  childName: string;
  age: number;
  activities: Activity[];
  hobbiesIdentified: boolean;
  interestsExplored: boolean;
  activityBudgetAvailable: boolean;
  memberOfClubOrGroup: boolean;
  attendsCommunityActivities: boolean;
  hasAchievementsRecorded: boolean;
  pocketMoneyForActivities: boolean;
  restrictedFromActivities: boolean;
  restrictionReason?: string;
}

export interface ActivityAssessment {
  childName: string;
  overallScore: number;
  overallRating: "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate";
  participationScore: number;
  varietyScore: number;
  engagementScore: number;
  integrationScore: number;
  totalActivities: number;
  activitiesPerWeek: number;
  categoriesCovered: number;
  communityRate: number;
  peerRate: number;
  childChoiceRate: number;
  achievements: string[];
  categoryBreakdown: CategoryBreakdown[];
  concerns: ActivityConcern[];
  strengths: ActivityStrength[];
  regulatoryFlags: RegulatoryFlag[];
  recommendations: string[];
  summary: string;
}

export interface CategoryBreakdown {
  category: ActivityCategory;
  count: number;
  percentage: number;
}

export interface ActivityConcern {
  severity: "critical" | "significant" | "moderate" | "low";
  category: string;
  description: string;
}

export interface ActivityStrength {
  category: string;
  description: string;
}

export interface RegulatoryFlag {
  regulation: string;
  area: string;
  status: "met" | "partially_met" | "not_met";
  detail: string;
}

// ── Main Engine ─────────────────────────────────────────────────────────────

export function analyseActivities(input: ActivityInput): ActivityAssessment {
  const { childName, activities } = input;

  // ── Basic metrics ───────────────────────────────────────────────────
  const totalActivities = activities.length;

  // Assume activities span ~12 weeks (3 months)
  const activitiesPerWeek = totalActivities > 0
    ? Math.round((totalActivities / 12) * 10) / 10
    : 0;

  const categoriesCovered = new Set(activities.map(a => a.category)).size;

  const communityActivities = activities.filter(a => a.communityBased);
  const communityRate = totalActivities > 0
    ? Math.round((communityActivities.length / totalActivities) * 100) / 100
    : 0;

  const peerActivities = activities.filter(a => a.peerInteraction);
  const peerRate = totalActivities > 0
    ? Math.round((peerActivities.length / totalActivities) * 100) / 100
    : 0;

  const childChoseActivities = activities.filter(a => a.childChose);
  const childChoiceRate = totalActivities > 0
    ? Math.round((childChoseActivities.length / totalActivities) * 100) / 100
    : 0;

  const achievements = activities
    .filter(a => a.achievementNoted)
    .map(a => a.achievementNoted!);

  const categoryBreakdown = analyseCategories(activities);

  // ── Scores ────────────────────────────────────────────────────────
  const participationScore = scoreParticipation(activitiesPerWeek, totalActivities);
  const varietyScore = scoreVariety(categoriesCovered, categoryBreakdown);
  const engagementScore = scoreEngagement(activities, childChoiceRate);
  const integrationScore = scoreIntegration(communityRate, peerRate, input);

  // ── Overall ───────────────────────────────────────────────────────
  const overallScore = Math.round(
    participationScore * 0.25 +
    varietyScore * 0.25 +
    engagementScore * 0.25 +
    integrationScore * 0.25
  );
  const overallRating = scoreToRating(overallScore);

  // ── Concerns ──────────────────────────────────────────────────────
  const concerns = identifyConcerns(input, activitiesPerWeek, categoriesCovered, communityRate, peerRate, childChoiceRate);

  // ── Strengths ─────────────────────────────────────────────────────
  const strengths = identifyStrengths(input, activitiesPerWeek, categoriesCovered, communityRate, peerRate, childChoiceRate, achievements);

  // ── Regulatory flags ──────────────────────────────────────────────
  const regulatoryFlags = assessRegulatory(input, activitiesPerWeek, communityRate, categoriesCovered);

  // ── Recommendations ───────────────────────────────────────────────
  const recommendations = buildRecommendations(input, activitiesPerWeek, categoriesCovered, communityRate, peerRate, childChoiceRate, categoryBreakdown);

  // ── Summary ───────────────────────────────────────────────────────
  const summary = buildSummary(childName, overallRating, activitiesPerWeek, categoriesCovered, achievements.length);

  return {
    childName,
    overallScore,
    overallRating,
    participationScore,
    varietyScore,
    engagementScore,
    integrationScore,
    totalActivities,
    activitiesPerWeek,
    categoriesCovered,
    communityRate,
    peerRate,
    childChoiceRate,
    achievements,
    categoryBreakdown,
    concerns,
    strengths,
    regulatoryFlags,
    recommendations,
    summary,
  };
}

// ── Category Analysis ───────────────────────────────────────────────────────

function analyseCategories(activities: Activity[]): CategoryBreakdown[] {
  const counts: Record<string, number> = {};
  activities.forEach(a => {
    counts[a.category] = (counts[a.category] ?? 0) + 1;
  });

  const total = activities.length || 1;
  return Object.entries(counts)
    .map(([category, count]) => ({
      category: category as ActivityCategory,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

// ── Scoring ─────────────────────────────────────────────────────────────────

function scoreParticipation(perWeek: number, total: number): number {
  if (total === 0) return 10;
  // Expect at least 3 activities per week
  if (perWeek >= 4) return 100;
  if (perWeek >= 3) return 90;
  if (perWeek >= 2) return 70;
  if (perWeek >= 1) return 50;
  return 30;
}

function scoreVariety(catCount: number, breakdown: CategoryBreakdown[]): number {
  if (catCount === 0) return 0;
  // Expect at least 4 different categories
  let score = Math.min(100, catCount * 20);

  // Penalise heavy concentration in one area (> 60%)
  if (breakdown.length > 0 && breakdown[0].percentage > 60) {
    score = Math.max(0, score - 15);
  }

  return score;
}

function scoreEngagement(activities: Activity[], choiceRate: number): number {
  if (activities.length === 0) return 10;

  let score = 0;

  // High engagement (40 points)
  const highEngagement = activities.filter(a => a.childEngagement === "high").length;
  const engagementRate = highEngagement / activities.length;
  score += Math.round(engagementRate * 40);

  // Child choice (30 points)
  score += Math.round(choiceRate * 30);

  // Recurring activities — shows commitment (15 points)
  const recurring = activities.filter(a => a.recurring).length;
  if (recurring >= 2) score += 15;
  else if (recurring >= 1) score += 10;

  // Not refusing (15 points)
  const refused = activities.filter(a => a.childEngagement === "refused").length;
  const refusalRate = refused / activities.length;
  score += Math.round((1 - refusalRate) * 15);

  return Math.min(100, score);
}

function scoreIntegration(communityRate: number, peerRate: number, input: ActivityInput): number {
  let score = 0;

  // Community-based activities (35 points)
  score += Math.round(communityRate * 35);

  // Peer interaction (35 points)
  score += Math.round(peerRate * 35);

  // Club membership (15 points)
  if (input.memberOfClubOrGroup) score += 15;

  // Attends community activities (15 points)
  if (input.attendsCommunityActivities) score += 15;

  return Math.min(100, score);
}

// ── Concerns ────────────────────────────────────────────────────────────────

function identifyConcerns(
  input: ActivityInput,
  perWeek: number,
  catCount: number,
  communityRate: number,
  peerRate: number,
  choiceRate: number,
): ActivityConcern[] {
  const concerns: ActivityConcern[] = [];

  // Restricted from activities
  if (input.restrictedFromActivities) {
    concerns.push({
      severity: "critical",
      category: "restriction",
      description: `Child restricted from activities${input.restrictionReason ? ` — ${input.restrictionReason}` : ""}. Rights concern.`,
    });
  }

  // Very low participation
  if (perWeek < 1 && input.activities.length > 0) {
    concerns.push({
      severity: "significant",
      category: "participation",
      description: "Activity participation very low — fewer than 1 per week",
    });
  } else if (input.activities.length === 0) {
    concerns.push({
      severity: "critical",
      category: "participation",
      description: "No activities recorded — child may be isolated",
    });
  }

  // No variety
  if (catCount <= 1 && input.activities.length >= 3) {
    concerns.push({
      severity: "moderate",
      category: "variety",
      description: "Activities limited to one category — broaden range of experiences",
    });
  }

  // No community activities
  if (communityRate === 0 && input.activities.length >= 3) {
    concerns.push({
      severity: "significant",
      category: "integration",
      description: "No community-based activities — risk of social isolation",
    });
  }

  // No peer interaction
  if (peerRate === 0 && input.activities.length >= 3) {
    concerns.push({
      severity: "significant",
      category: "socialisation",
      description: "No activities involving peers — social development may be affected",
    });
  }

  // Low choice
  if (choiceRate < 0.3 && input.activities.length >= 3) {
    concerns.push({
      severity: "moderate",
      category: "choice",
      description: "Child has limited choice in activities — explore interests",
    });
  }

  // Hobbies not identified
  if (!input.hobbiesIdentified) {
    concerns.push({
      severity: "moderate",
      category: "interests",
      description: "Hobbies and interests not identified — personalised enrichment needed",
    });
  }

  // No budget
  if (!input.activityBudgetAvailable) {
    concerns.push({
      severity: "moderate",
      category: "access",
      description: "No dedicated activity budget — may limit participation",
    });
  }

  return concerns;
}

// ── Strengths ───────────────────────────────────────────────────────────────

function identifyStrengths(
  input: ActivityInput,
  perWeek: number,
  catCount: number,
  communityRate: number,
  peerRate: number,
  choiceRate: number,
  achievements: string[],
): ActivityStrength[] {
  const strengths: ActivityStrength[] = [];

  if (perWeek >= 3) {
    strengths.push({
      category: "participation",
      description: "Active participation in activities — at least 3 per week",
    });
  }

  if (catCount >= 4) {
    strengths.push({
      category: "variety",
      description: "Broad range of activity types — well-rounded enrichment",
    });
  }

  if (communityRate >= 0.5 && input.activities.length >= 3) {
    strengths.push({
      category: "integration",
      description: "Good community engagement through activities",
    });
  }

  if (peerRate >= 0.5 && input.activities.length >= 3) {
    strengths.push({
      category: "socialisation",
      description: "Regular peer interaction through activities",
    });
  }

  if (choiceRate >= 0.7 && input.activities.length >= 3) {
    strengths.push({
      category: "choice",
      description: "Child actively choosing activities — interests driving enrichment",
    });
  }

  if (achievements.length >= 2) {
    strengths.push({
      category: "achievement",
      description: "Achievements being recognised and recorded",
    });
  }

  if (input.memberOfClubOrGroup) {
    strengths.push({
      category: "commitment",
      description: "Member of club or group — building belonging and routine",
    });
  }

  return strengths;
}

// ── Regulatory Flags ────────────────────────────────────────────────────────

function assessRegulatory(
  input: ActivityInput,
  perWeek: number,
  communityRate: number,
  catCount: number,
): RegulatoryFlag[] {
  const flags: RegulatoryFlag[] = [];

  // CHR 2015 Reg 9 — Enjoyment and achievement
  const enjoymentGood = perWeek >= 2 && catCount >= 2 && !input.restrictedFromActivities;
  flags.push({
    regulation: "CHR 2015 Reg 9",
    area: "Enjoyment & Achievement",
    status: enjoymentGood ? "met" : perWeek >= 1 ? "partially_met" : "not_met",
    detail: enjoymentGood
      ? "Child has regular, varied activities supporting enjoyment and achievement"
      : "Activity provision insufficient for enjoyment and achievement",
  });

  // CHR 2015 Reg 7 — Recreation
  flags.push({
    regulation: "CHR 2015 Reg 7",
    area: "Recreation",
    status: input.activities.length > 0 && !input.restrictedFromActivities ? "met" :
      input.restrictedFromActivities ? "not_met" : "partially_met",
    detail: input.restrictedFromActivities
      ? "Child restricted from activities — Reg 7 not met"
      : input.activities.length > 0
      ? "Recreation activities provided"
      : "No recreation activities evidenced",
  });

  // SCCIF — Experiences
  const broadExperiences = catCount >= 3 && communityRate > 0;
  flags.push({
    regulation: "SCCIF",
    area: "Experiences",
    status: broadExperiences ? "met" : catCount >= 2 ? "partially_met" : "not_met",
    detail: broadExperiences
      ? "Child accessing broad range of experiences in community"
      : "Range of experiences needs broadening",
  });

  return flags;
}

// ── Recommendations ─────────────────────────────────────────────────────────

function buildRecommendations(
  input: ActivityInput,
  perWeek: number,
  catCount: number,
  communityRate: number,
  peerRate: number,
  choiceRate: number,
  breakdown: CategoryBreakdown[],
): string[] {
  const recs: string[] = [];

  if (input.restrictedFromActivities) {
    recs.push("URGENT: Review restriction from activities — child has right to recreation");
  }

  if (perWeek < 2 && input.activities.length > 0) {
    recs.push("Increase activity frequency — aim for at least 3 activities per week");
  } else if (input.activities.length === 0) {
    recs.push("PRIORITY: Begin activity programme — explore interests with child");
  }

  if (catCount < 3 && input.activities.length >= 3) {
    // Suggest categories not covered
    const covered = new Set(breakdown.map(b => b.category));
    const suggestions: ActivityCategory[] = ["sport", "creative_arts", "social", "outdoor", "cultural"];
    const missing = suggestions.filter(s => !covered.has(s));
    if (missing.length > 0) {
      recs.push(`Broaden activities — try ${missing.slice(0, 2).map(m => m.replace(/_/g, " ")).join(" or ")}`);
    }
  }

  if (communityRate < 0.3 && input.activities.length >= 3) {
    recs.push("Increase community-based activities to support integration and belonging");
  }

  if (peerRate < 0.3 && input.activities.length >= 3) {
    recs.push("Support activities with peers outside the home");
  }

  if (choiceRate < 0.5 && input.activities.length >= 3) {
    recs.push("Give child more choice in activities — explore personal interests");
  }

  if (!input.hobbiesIdentified) {
    recs.push("Identify hobbies and interests to personalise activity programme");
  }

  if (!input.memberOfClubOrGroup && input.activities.length > 0) {
    recs.push("Support joining a regular club or group for routine and belonging");
  }

  if (!input.hasAchievementsRecorded && input.activities.length >= 3) {
    recs.push("Record achievements — celebrate progress to build confidence");
  }

  return recs;
}

// ── Summary ─────────────────────────────────────────────────────────────────

function buildSummary(
  childName: string,
  rating: string,
  perWeek: number,
  catCount: number,
  achievementCount: number,
): string {
  if (perWeek === 0) {
    return `${childName}: No activities recorded. Activity programme needed.`;
  }
  const achDesc = achievementCount > 0 ? `, ${achievementCount} achievements recorded` : "";
  return `${childName}: Activities rated ${rating.replace(/_/g, " ")}. ${perWeek}/wk across ${catCount} categories${achDesc}.`;
}

// ── Utility ─────────────────────────────────────────────────────────────────

function scoreToRating(score: number): "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate" {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 55) return "adequate";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}
