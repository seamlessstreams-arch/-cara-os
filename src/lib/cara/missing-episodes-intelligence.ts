// ══════════════════════════════════════════════════════════════════════════════
// Cara Intelligence Engine — Missing Episodes Analysis
//
// Pure deterministic analysis of missing/absent episodes for LAC.
// Tracks:
//   - Episode frequency, duration, and timing patterns
//   - Return Home Interview (RHI) compliance
//   - Push/pull factor identification
//   - Escalation detection (frequency increasing, duration lengthening)
//   - CSE/CCE risk indicator correlation
//   - Multi-agency response (police, social worker notification)
//
// Regulatory alignment:
//   - CHR 2015 Reg 34 — Missing child (notification & recording)
//   - CHR 2015 Reg 34(1) — Procedures for missing children
//   - Statutory guidance: Children who run away or go missing from home or care
//   - SCCIF — Safety judgement
//
// No AI calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

import { weightedMeanOf } from "@/lib/metrics/rate";

// ── Types ───────────────────────────────────────────────────────────────────

export type EpisodeCategory = "missing" | "absent" | "away_without_permission";

export type EpisodeOutcome =
  | "returned_self"
  | "found_by_staff"
  | "found_by_police"
  | "returned_by_family"
  | "returned_by_friend"
  | "still_missing"
  | "other";

export interface MissingEpisode {
  id: string;
  date: string; // ISO date of start
  startTime: string; // HH:MM
  endDate?: string; // ISO date if different day
  endTime?: string; // HH:MM when returned
  category: EpisodeCategory;
  durationMinutes?: number; // auto-calculated if end known
  outcome: EpisodeOutcome;
  policeNotified: boolean;
  policeRefNumber?: string;
  socialWorkerNotified: boolean;
  ofstedNotified?: boolean; // required for >24h missing
  returnHomeInterview: {
    offered: boolean;
    completed: boolean;
    within72Hours?: boolean;
    conductedBy?: string; // independent person
    pushFactors?: string[];
    pullFactors?: string[];
    safetyPlanUpdated?: boolean;
  };
  riskFactorsIdentified?: string[];
  locationIfKnown?: string;
  withWhom?: string;
  triggers?: string[];
  staffResponse?: string;
  dayOfWeek?: number; // 0=Sun, 6=Sat
}

export interface MissingInput {
  childId: string;
  childName: string;
  age: number;
  episodes: MissingEpisode[];
  hasRiskAssessment: boolean;
  riskAssessmentUpToDate: boolean;
  hasMissingProtocol: boolean;
  missingProtocolReviewDate?: string;
  knownCSERisk: boolean;
  knownCCERisk: boolean;
  knownGangAssociation: boolean;
  placementType: string;
}

export interface MissingAssessment {
  childName: string;
  overallScore: number | null;
  overallRating: "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate" | null;
  frequencyScore: number;
  responseScore: number | null; // null when there are no episodes to respond to (unmeasured)
  riskScore: number;
  complianceScore: number;
  totalEpisodes: number;
  missingEpisodes: number;
  absentEpisodes: number;
  averageDurationMinutes: number;
  longestEpisodeMinutes: number;
  episodesLast30Days: number;
  episodesLast90Days: number;
  trend: "improving" | "stable" | "escalating";
  riskLevel: "low" | "medium" | "high" | "very_high";
  patterns: MissingPattern[];
  concerns: MissingConcern[];
  strengths: MissingStrength[];
  regulatoryFlags: RegulatoryFlag[];
  rhi: RHICompliance;
  recommendations: string[];
  summary: string;
}

export interface MissingPattern {
  type: string;
  description: string;
  significance: "high" | "medium" | "low";
}

export interface MissingConcern {
  severity: "critical" | "significant" | "moderate" | "low";
  category: string;
  description: string;
}

export interface MissingStrength {
  category: string;
  description: string;
}

export interface RegulatoryFlag {
  regulation: string;
  area: string;
  status: "met" | "partially_met" | "not_met";
  detail: string;
}

export interface RHICompliance {
  totalEligible: number;
  offered: number;
  completed: number;
  within72Hours: number;
  offerRate: number;
  completionRate: number;
  timelinessRate: number;
}

// ── Main Engine ─────────────────────────────────────────────────────────────

export function analyseMissingEpisodes(input: MissingInput): MissingAssessment {
  const { childName, episodes } = input;

  if (episodes.length === 0) {
    return buildNoEpisodesAssessment(input);
  }

  // ── Basic counts ──────────────────────────────────────────────────────
  const missingEps = episodes.filter(e => e.category === "missing");
  const absentEps = episodes.filter(e => e.category === "absent" || e.category === "away_without_permission");
  const totalEpisodes = episodes.length;

  // ── Duration analysis ─────────────────────────────────────────────────
  const durations = episodes
    .map(e => e.durationMinutes ?? calculateDuration(e))
    .filter(d => d > 0);
  const averageDuration = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;
  const longestDuration = durations.length > 0 ? Math.max(...durations) : 0;

  // ── Recent episodes ───────────────────────────────────────────────────
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000).toISOString().slice(0, 10);
  const episodesLast30 = episodes.filter(e => e.date >= thirtyDaysAgo && e.date.slice(0, 10) <= today).length;
  const episodesLast90 = episodes.filter(e => e.date >= ninetyDaysAgo && e.date.slice(0, 10) <= today).length;

  // ── Trend ─────────────────────────────────────────────────────────────
  const trend = analyseTrend(episodes);

  // ── Risk level ────────────────────────────────────────────────────────
  const riskLevel = assessRiskLevel(input, episodes, trend, averageDuration);

  // ── RHI compliance ────────────────────────────────────────────────────
  const rhi = assessRHICompliance(episodes);

  // ── Patterns ──────────────────────────────────────────────────────────
  const patterns = identifyPatterns(episodes, input);

  // ── Scores ────────────────────────────────────────────────────────────
  const frequencyScore = scoreFrequency(episodesLast30, episodesLast90, totalEpisodes);
  const responseScore = scoreResponse(episodes);
  const riskScore = scoreRisk(riskLevel);
  const complianceScore = scoreCompliance(rhi, input, episodes);

  // ── Overall ───────────────────────────────────────────────────────────
  // weightedMeanOf renormalises over the measured components, so an unmeasured
  // responseScore (no episodes) neither flatters nor penalises the overall.
  const overallScore = weightedMeanOf([
    { score: frequencyScore, weight: 0.30 },
    { score: responseScore, weight: 0.25 },
    { score: riskScore, weight: 0.20 },
    { score: complianceScore, weight: 0.25 },
  ]);
  const overallRating = scoreToRating(overallScore);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns = identifyConcerns(input, episodes, rhi, trend, averageDuration, episodesLast30);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths = identifyStrengths(input, rhi, episodes, trend);

  // ── Regulatory flags ──────────────────────────────────────────────────
  const regulatoryFlags = assessRegulatory(input, episodes, rhi, riskLevel);

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations = buildRecommendations(input, rhi, trend, riskLevel, episodes, patterns);

  // ── Summary ───────────────────────────────────────────────────────────
  const summary = buildSummary(childName, totalEpisodes, episodesLast30, trend, riskLevel);

  return {
    childName,
    overallScore,
    overallRating,
    frequencyScore,
    responseScore,
    riskScore,
    complianceScore,
    totalEpisodes,
    missingEpisodes: missingEps.length,
    absentEpisodes: absentEps.length,
    averageDurationMinutes: averageDuration,
    longestEpisodeMinutes: longestDuration,
    episodesLast30Days: episodesLast30,
    episodesLast90Days: episodesLast90,
    trend,
    riskLevel,
    patterns,
    concerns,
    strengths,
    regulatoryFlags,
    rhi,
    recommendations,
    summary,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function calculateDuration(episode: MissingEpisode): number {
  if (!episode.endTime) return 0;
  const [sh, sm] = episode.startTime.split(":").map(Number);
  const [eh, em] = (episode.endTime).split(":").map(Number);
  let startMins = sh * 60 + sm;
  let endMins = eh * 60 + em;

  // Handle multi-day
  if (episode.endDate && episode.endDate !== episode.date) {
    const startMs = new Date(episode.date).getTime() + startMins * 60000;
    const endMs = new Date(episode.endDate).getTime() + endMins * 60000;
    return Math.round((endMs - startMs) / 60000);
  }

  // Same day
  if (endMins < startMins) endMins += 24 * 60;
  return endMins - startMins;
}

function analyseTrend(episodes: MissingEpisode[]): "improving" | "stable" | "escalating" {
  if (episodes.length < 4) return "stable";

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000).toISOString().slice(0, 10);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000).toISOString().slice(0, 10);

  const last30 = episodes.filter(e => e.date >= thirtyDaysAgo && e.date.slice(0, 10) <= today).length;
  const mid30 = episodes.filter(e => e.date >= sixtyDaysAgo && e.date < thirtyDaysAgo).length;
  const first30 = episodes.filter(e => e.date >= ninetyDaysAgo && e.date < sixtyDaysAgo).length;

  // Escalating: recent period has more than previous
  if (last30 > mid30 + 1 || (last30 > 0 && last30 > first30 * 2)) return "escalating";
  // Improving: recent period has fewer
  if (last30 < mid30 - 1 || (mid30 > 0 && last30 === 0)) return "improving";
  return "stable";
}

function assessRiskLevel(
  input: MissingInput,
  episodes: MissingEpisode[],
  trend: string,
  avgDuration: number,
): "low" | "medium" | "high" | "very_high" {
  let riskPoints = 0;

  // Frequency
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
  const recent = episodes.filter(e => e.date >= thirtyDaysAgo && e.date.slice(0, 10) <= today).length;
  if (recent >= 5) riskPoints += 4;
  else if (recent >= 3) riskPoints += 3;
  else if (recent >= 1) riskPoints += 1;

  // Duration
  if (avgDuration > 1440) riskPoints += 3; // >24h average
  else if (avgDuration > 480) riskPoints += 2; // >8h
  else if (avgDuration > 120) riskPoints += 1; // >2h

  // Trend
  if (trend === "escalating") riskPoints += 3;

  // CSE/CCE
  if (input.knownCSERisk) riskPoints += 3;
  if (input.knownCCERisk) riskPoints += 3;
  if (input.knownGangAssociation) riskPoints += 2;

  // Missing (vs absent) episodes
  const missingCount = episodes.filter(e => e.category === "missing").length;
  if (missingCount >= 3) riskPoints += 2;

  // Found by police repeatedly
  const policeFound = episodes.filter(e => e.outcome === "found_by_police").length;
  if (policeFound >= 2) riskPoints += 2;

  // Still missing
  const stillMissing = episodes.filter(e => e.outcome === "still_missing").length;
  if (stillMissing > 0) riskPoints += 4;

  if (riskPoints >= 10) return "very_high";
  if (riskPoints >= 6) return "high";
  if (riskPoints >= 3) return "medium";
  return "low";
}

function assessRHICompliance(episodes: MissingEpisode[]): RHICompliance {
  // RHI should be offered for all missing/absent episodes (not "away without permission" under 1h)
  const eligible = episodes.filter(e =>
    e.category === "missing" || (e.category === "absent" && (e.durationMinutes ?? 60) >= 60)
  );

  const offered = eligible.filter(e => e.returnHomeInterview.offered).length;
  const completed = eligible.filter(e => e.returnHomeInterview.completed).length;
  const within72 = eligible.filter(e => e.returnHomeInterview.within72Hours).length;

  return {
    totalEligible: eligible.length,
    offered,
    completed,
    within72Hours: within72,
    offerRate: eligible.length > 0 ? offered / eligible.length : 1,
    completionRate: eligible.length > 0 ? completed / eligible.length : 1,
    timelinessRate: offered > 0 ? within72 / offered : 1,
  };
}

function identifyPatterns(episodes: MissingEpisode[], input: MissingInput): MissingPattern[] {
  const patterns: MissingPattern[] = [];
  if (episodes.length < 2) return patterns;

  // Day-of-week pattern
  const dayCount: Record<number, number> = {};
  episodes.forEach(e => {
    const dow = e.dayOfWeek ?? new Date(e.date).getDay();
    dayCount[dow] = (dayCount[dow] || 0) + 1;
  });
  const maxDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0];
  if (maxDay && Number(maxDay[1]) >= 3 && Number(maxDay[1]) / episodes.length > 0.4) {
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    patterns.push({
      type: "day_of_week",
      description: `Episodes frequently occur on ${dayNames[Number(maxDay[0])]}s (${maxDay[1]} of ${episodes.length})`,
      significance: "medium",
    });
  }

  // Time-of-day pattern
  const eveningEps = episodes.filter(e => {
    const [h] = e.startTime.split(":").map(Number);
    return h >= 18 || h < 5;
  });
  if (eveningEps.length / episodes.length > 0.6) {
    patterns.push({
      type: "evening_night",
      description: `${Math.round(eveningEps.length / episodes.length * 100)}% of episodes begin in evening/night`,
      significance: "medium",
    });
  }

  // After contact pattern
  const afterContact = episodes.filter(e =>
    e.triggers?.some(t => t.toLowerCase().includes("contact") || t.toLowerCase().includes("family"))
  );
  if (afterContact.length >= 2 && afterContact.length / episodes.length > 0.3) {
    patterns.push({
      type: "post_contact",
      description: "Episodes frequently follow family contact",
      significance: "high",
    });
  }

  // Duration escalation
  if (episodes.length >= 4) {
    const durations = episodes.map(e => e.durationMinutes ?? calculateDuration(e)).filter(d => d > 0);
    if (durations.length >= 4) {
      const firstHalf = durations.slice(0, Math.floor(durations.length / 2));
      const secondHalf = durations.slice(Math.floor(durations.length / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      if (secondAvg > firstAvg * 1.5) {
        patterns.push({
          type: "duration_escalation",
          description: "Episode durations are increasing over time",
          significance: "high",
        });
      }
    }
  }

  // Same location
  const locations = episodes.map(e => e.locationIfKnown).filter(Boolean);
  if (locations.length >= 3) {
    const locCount: Record<string, number> = {};
    locations.forEach(l => { locCount[l!] = (locCount[l!] || 0) + 1; });
    const topLoc = Object.entries(locCount).sort((a, b) => b[1] - a[1])[0];
    if (topLoc && topLoc[1] >= 3) {
      patterns.push({
        type: "repeat_location",
        description: `Frequently goes to same location (${topLoc[1]} episodes)`,
        significance: "high",
      });
    }
  }

  // Same person
  const persons = episodes.map(e => e.withWhom).filter(Boolean);
  if (persons.length >= 2) {
    const personCount: Record<string, number> = {};
    persons.forEach(p => { personCount[p!] = (personCount[p!] || 0) + 1; });
    const topPerson = Object.entries(personCount).sort((a, b) => b[1] - a[1])[0];
    if (topPerson && topPerson[1] >= 2) {
      patterns.push({
        type: "repeat_associate",
        description: `Repeatedly found with same individual(s) (${topPerson[1]} episodes)`,
        significance: "high",
      });
    }
  }

  return patterns;
}

// ── Scoring ─────────────────────────────────────────────────────────────────

function scoreFrequency(last30: number, last90: number, total: number): number {
  // Inverse scoring: fewer episodes = higher score
  if (total === 0) return 100;
  if (last30 >= 5) return 10;
  if (last30 >= 3) return 25;
  if (last30 >= 2) return 40;
  if (last30 === 1) return 55;
  if (last90 >= 3) return 60;
  if (last90 >= 1) return 75;
  return 85;
}

function scoreResponse(episodes: MissingEpisode[]): number | null {
  if (episodes.length === 0) return null; // no episodes to respond to — response quality is unmeasured
  let totalScore = 0;
  for (const ep of episodes) {
    let epScore = 100;
    // Police notification for missing
    if (ep.category === "missing" && !ep.policeNotified) epScore -= 30;
    // Social worker notification
    if (!ep.socialWorkerNotified) epScore -= 20;
    // RHI offered
    if (!ep.returnHomeInterview.offered) epScore -= 25;
    // RHI completed
    if (ep.returnHomeInterview.offered && !ep.returnHomeInterview.completed) epScore -= 15;
    // Within 72 hours
    if (ep.returnHomeInterview.completed && !ep.returnHomeInterview.within72Hours) epScore -= 10;
    totalScore += Math.max(0, epScore);
  }
  return Math.round(totalScore / episodes.length);
}

function scoreRisk(riskLevel: string): number {
  // Inverse: lower risk = higher score
  switch (riskLevel) {
    case "low": return 100;
    case "medium": return 65;
    case "high": return 35;
    case "very_high": return 10;
    default: return 50;
  }
}

function scoreCompliance(rhi: RHICompliance, input: MissingInput, episodes: MissingEpisode[]): number {
  let score = 0;

  // RHI offer rate (30 points)
  score += Math.round(rhi.offerRate * 30);

  // RHI completion rate (25 points)
  score += Math.round(rhi.completionRate * 25);

  // RHI timeliness (15 points)
  score += Math.round(rhi.timelinessRate * 15);

  // Risk assessment (15 points)
  if (input.hasRiskAssessment && input.riskAssessmentUpToDate) score += 15;
  else if (input.hasRiskAssessment) score += 8;

  // Protocol in place (15 points)
  if (input.hasMissingProtocol) score += 15;

  return Math.min(100, score);
}

// ── Concerns ────────────────────────────────────────────────────────────────

function identifyConcerns(
  input: MissingInput,
  episodes: MissingEpisode[],
  rhi: RHICompliance,
  trend: string,
  avgDuration: number,
  last30: number,
): MissingConcern[] {
  const concerns: MissingConcern[] = [];

  // Escalating pattern
  if (trend === "escalating") {
    concerns.push({
      severity: "critical",
      category: "escalation",
      description: "Missing episodes are escalating in frequency — immediate strategy review needed",
    });
  }

  // High frequency
  if (last30 >= 5) {
    concerns.push({
      severity: "critical",
      category: "frequency",
      description: `${last30} episodes in the last 30 days — very high frequency`,
    });
  } else if (last30 >= 3) {
    concerns.push({
      severity: "significant",
      category: "frequency",
      description: `${last30} episodes in the last 30 days`,
    });
  }

  // Long duration
  if (avgDuration > 1440) {
    concerns.push({
      severity: "critical",
      category: "duration",
      description: `Average episode duration exceeds 24 hours`,
    });
  } else if (avgDuration > 480) {
    concerns.push({
      severity: "significant",
      category: "duration",
      description: `Average episode duration of ${Math.round(avgDuration / 60)} hours`,
    });
  }

  // CSE/CCE risk
  if (input.knownCSERisk) {
    concerns.push({
      severity: "critical",
      category: "exploitation",
      description: "Known CSE risk — missing episodes increase vulnerability",
    });
  }
  if (input.knownCCERisk) {
    concerns.push({
      severity: "critical",
      category: "exploitation",
      description: "Known CCE risk — missing episodes may indicate ongoing exploitation",
    });
  }

  // RHI not being offered
  if (rhi.totalEligible > 0 && rhi.offerRate < 0.5) {
    concerns.push({
      severity: "significant",
      category: "rhi_compliance",
      description: `Return Home Interviews only offered for ${Math.round(rhi.offerRate * 100)}% of episodes`,
    });
  }

  // RHI not completed
  if (rhi.totalEligible > 0 && rhi.completionRate < 0.5 && rhi.offerRate >= 0.5) {
    concerns.push({
      severity: "significant",
      category: "rhi_compliance",
      description: `Return Home Interviews only completed for ${Math.round(rhi.completionRate * 100)}% of eligible episodes`,
    });
  }

  // Police not notified for missing
  const missingNoPolice = episodes.filter(e => e.category === "missing" && !e.policeNotified);
  if (missingNoPolice.length > 0) {
    concerns.push({
      severity: "critical",
      category: "notification",
      description: `Police not notified for ${missingNoPolice.length} missing episode(s) — statutory requirement`,
    });
  }

  // No risk assessment
  if (!input.hasRiskAssessment && episodes.length >= 2) {
    concerns.push({
      severity: "significant",
      category: "risk_management",
      description: "No risk assessment in place despite repeated episodes",
    });
  }

  // No protocol
  if (!input.hasMissingProtocol && episodes.length >= 2) {
    concerns.push({
      severity: "moderate",
      category: "protocol",
      description: "No missing person protocol in place for this child",
    });
  }

  // Still missing
  const stillMissing = episodes.filter(e => e.outcome === "still_missing");
  if (stillMissing.length > 0) {
    concerns.push({
      severity: "critical",
      category: "current_status",
      description: "Child is currently reported as missing",
    });
  }

  return concerns;
}

// ── Strengths ───────────────────────────────────────────────────────────────

function identifyStrengths(
  input: MissingInput,
  rhi: RHICompliance,
  episodes: MissingEpisode[],
  trend: string,
): MissingStrength[] {
  const strengths: MissingStrength[] = [];

  if (trend === "improving") {
    strengths.push({
      category: "trend",
      description: "Missing episodes are reducing in frequency",
    });
  }

  if (rhi.completionRate >= 0.9 && rhi.totalEligible > 0) {
    strengths.push({
      category: "rhi",
      description: "Excellent RHI completion rate",
    });
  }

  if (rhi.timelinessRate >= 0.9 && rhi.totalEligible > 0) {
    strengths.push({
      category: "timeliness",
      description: "RHIs consistently completed within 72 hours",
    });
  }

  if (input.hasRiskAssessment && input.riskAssessmentUpToDate) {
    strengths.push({
      category: "risk_management",
      description: "Up-to-date risk assessment in place",
    });
  }

  if (input.hasMissingProtocol) {
    strengths.push({
      category: "protocol",
      description: "Missing person protocol established",
    });
  }

  // All police notifications done
  const allPoliceNotified = episodes
    .filter(e => e.category === "missing")
    .every(e => e.policeNotified);
  if (allPoliceNotified && episodes.filter(e => e.category === "missing").length > 0) {
    strengths.push({
      category: "notification",
      description: "Police consistently notified for all missing episodes",
    });
  }

  // Returns quickly
  const durations = episodes.map(e => e.durationMinutes ?? calculateDuration(e)).filter(d => d > 0);
  if (durations.length > 0) {
    const avgDur = durations.reduce((a, b) => a + b, 0) / durations.length;
    if (avgDur < 120 && episodes.length > 0) {
      strengths.push({
        category: "duration",
        description: "Episodes typically short duration (under 2 hours)",
      });
    }
  }

  return strengths;
}

// ── Regulatory Flags ────────────────────────────────────────────────────────

function assessRegulatory(
  input: MissingInput,
  episodes: MissingEpisode[],
  rhi: RHICompliance,
  riskLevel: string,
): RegulatoryFlag[] {
  const flags: RegulatoryFlag[] = [];

  // CHR 2015 Reg 34(1) — Procedures
  const hasProtocol = input.hasMissingProtocol;
  const policeAlwaysNotified = episodes
    .filter(e => e.category === "missing")
    .every(e => e.policeNotified);
  flags.push({
    regulation: "CHR 2015 Reg 34(1)",
    area: "Missing Procedures",
    status: (hasProtocol && policeAlwaysNotified) ? "met" :
      (!hasProtocol && episodes.length >= 2) ? "not_met" : "partially_met",
    detail: (hasProtocol && policeAlwaysNotified)
      ? "Missing procedures established and followed"
      : !hasProtocol
      ? "Missing person protocol not in place"
      : "Some notifications missed — review procedures",
  });

  // Statutory Guidance — RHI
  flags.push({
    regulation: "Missing Children Guidance",
    area: "Return Home Interviews",
    status: rhi.completionRate >= 0.8 ? "met" :
      rhi.completionRate >= 0.5 ? "partially_met" : "not_met",
    detail: rhi.completionRate >= 0.8
      ? `RHI completed for ${Math.round(rhi.completionRate * 100)}% of episodes`
      : `RHI completion rate only ${Math.round(rhi.completionRate * 100)}% — below expected standard`,
  });

  // SCCIF — Safety
  const isSafe = riskLevel === "low" || riskLevel === "medium";
  flags.push({
    regulation: "SCCIF",
    area: "Safety",
    status: isSafe ? "met" : riskLevel === "high" ? "partially_met" : "not_met",
    detail: isSafe
      ? "Missing episode risk appropriately managed"
      : "High risk from missing episodes requires immediate action",
  });

  // CHR 2015 Reg 34 — Recording
  const allRecorded = episodes.every(e => e.startTime && (e.endTime || e.outcome === "still_missing"));
  flags.push({
    regulation: "CHR 2015 Reg 34",
    area: "Recording",
    status: allRecorded ? "met" : "partially_met",
    detail: allRecorded
      ? "All episodes recorded with required details"
      : "Some episodes missing required recording detail",
  });

  return flags;
}

// ── Recommendations ─────────────────────────────────────────────────────────

function buildRecommendations(
  input: MissingInput,
  rhi: RHICompliance,
  trend: string,
  riskLevel: string,
  episodes: MissingEpisode[],
  patterns: MissingPattern[],
): string[] {
  const recs: string[] = [];

  if (trend === "escalating") {
    recs.push("URGENT: Convene strategy meeting — missing episodes escalating");
  }

  if (riskLevel === "very_high" || riskLevel === "high") {
    recs.push("Review and update risk assessment with multi-agency partners");
  }

  if (!input.hasMissingProtocol && episodes.length >= 2) {
    recs.push("Develop individual missing person protocol for this child");
  }

  if (rhi.offerRate < 0.8) {
    recs.push("Ensure Return Home Interviews are offered after every episode");
  }

  if (rhi.completionRate < 0.7 && rhi.offerRate >= 0.7) {
    recs.push("Address barriers to RHI completion — consider alternative approaches");
  }

  if (input.knownCSERisk || input.knownCCERisk) {
    recs.push("Ensure exploitation risk assessment is reviewed in light of missing episodes");
  }

  const postContact = patterns.find(p => p.type === "post_contact");
  if (postContact) {
    recs.push("Review family contact arrangements — episodes correlated with contact sessions");
  }

  const repeatLocation = patterns.find(p => p.type === "repeat_location");
  if (repeatLocation) {
    recs.push("Investigate significance of repeat location — consider safeguarding implications");
  }

  const repeatAssociate = patterns.find(p => p.type === "repeat_associate");
  if (repeatAssociate) {
    recs.push("Assess risk of repeat associate — consider information sharing with police");
  }

  if (!input.hasRiskAssessment && episodes.length >= 3) {
    recs.push("Complete missing-specific risk assessment as a priority");
  }

  if (episodes.filter(e => e.category === "missing" && !e.policeNotified).length > 0) {
    recs.push("Ensure police are ALWAYS notified for missing (not absent) episodes");
  }

  return recs;
}

// ── Summary ─────────────────────────────────────────────────────────────────

function buildSummary(
  childName: string,
  total: number,
  last30: number,
  trend: string,
  riskLevel: string,
): string {
  const trendDesc = trend === "escalating" ? "Trend: escalating." :
    trend === "improving" ? "Trend: improving." : "";
  const riskDesc = riskLevel === "very_high" || riskLevel === "high"
    ? `Risk level: ${riskLevel.replace("_", " ")}.`
    : "";

  return `${childName}: ${total} total episode${total !== 1 ? "s" : ""}, ${last30} in last 30 days. ${trendDesc} ${riskDesc}`.trim();
}

// ── No episodes assessment ──────────────────────────────────────────────────

function buildNoEpisodesAssessment(input: MissingInput): MissingAssessment {
  return {
    childName: input.childName,
    overallScore: 100,
    overallRating: "excellent",
    frequencyScore: 100,
    responseScore: null, // no episodes to respond to — response quality is unmeasured, not perfect
    riskScore: 100,
    complianceScore: 100,
    totalEpisodes: 0,
    missingEpisodes: 0,
    absentEpisodes: 0,
    averageDurationMinutes: 0,
    longestEpisodeMinutes: 0,
    episodesLast30Days: 0,
    episodesLast90Days: 0,
    trend: "stable",
    riskLevel: "low",
    patterns: [],
    concerns: [],
    strengths: [{
      category: "safety",
      description: "No missing or absent episodes recorded",
    }],
    regulatoryFlags: [{
      regulation: "CHR 2015 Reg 34",
      area: "Missing Children",
      status: "met",
      detail: "No missing episodes — child safely in placement",
    }],
    rhi: {
      totalEligible: 0,
      offered: 0,
      completed: 0,
      within72Hours: 0,
      offerRate: 1,
      completionRate: 1,
      timelinessRate: 1,
    },
    recommendations: [],
    summary: `${input.childName}: No missing or absent episodes recorded. Child safely in placement.`,
  };
}

// ── Utility ─────────────────────────────────────────────────────────────────

function scoreToRating(score: number | null): "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate" | null {
  if (score === null) return null; // unmeasured overall — no rating
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 55) return "adequate";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}
