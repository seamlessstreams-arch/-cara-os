// ══════════════════════════════════════════════════════════════════════════════
// Cara Missing From Care — Episode Tracking Engine
//
// Deterministic engine for managing missing from care episodes, return
// interviews, risk assessments, and pattern analysis.
//
// Aligned to:
//   - CHR 2015 Reg 34(1)(f) — procedures for when a child goes missing
//   - DfE Statutory Guidance: Children who run away or go missing
//   - Local protocol requirements (police notification timelines)
//
// Every missing episode must:
//   1. Be logged immediately with police notified within local protocol times
//   2. Have return interview within 72 hours of return
//   3. Be included in Reg 44 reports
//   4. Feed into risk assessment updates
//   5. Trigger pattern analysis for prevention
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

import { rate, rateOf } from "@/lib/metrics/rate";

// ── Types ──────────────────────────────────────────────────────────────────

export type EpisodeStatus =
  | "active"              // child currently missing
  | "found_safe"         // located and returned safely
  | "found_harmed"       // located but harm identified
  | "returned_self"      // returned of own accord
  | "returned_police"    // returned by police
  | "returned_other"     // returned by other means
  | "cancelled";         // false alarm / incorrectly logged

export type RiskGrading =
  | "absent"             // no apparent risk (unauthorised absence)
  | "low"               // missing — low risk
  | "medium"            // missing — medium risk
  | "high"              // missing — high risk (CSE/CCE indicators)
  | "critical";         // immediate danger

export type ReturnInterviewStatus =
  | "pending"           // not yet conducted
  | "scheduled"         // booked with independent person
  | "completed"         // interview done within 72h
  | "completed_late"    // interview done but after 72h
  | "refused"           // child refused (must still offer)
  | "not_conducted";    // not done — compliance failure

export type PushFactor =
  | "peer_influence"
  | "substance_use"
  | "cse_cce_concern"
  | "family_contact"
  | "placement_unhappy"
  | "bullying"
  | "mental_health"
  | "boundary_testing"
  | "boredom"
  | "unknown";

export type PullFactor =
  | "peer_group"
  | "partner"
  | "substance_access"
  | "exploitation"
  | "family"
  | "specific_location"
  | "social_media_contact"
  | "unknown";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface MissingEpisode {
  id: string;
  childId: string;
  childName: string;
  homeId: string;
  status: EpisodeStatus;
  riskGrading: RiskGrading;

  // Timeline
  reportedMissingAt: string;
  lastSeenAt: string;
  lastSeenLocation: string;
  returnedAt?: string;
  durationMinutes?: number;

  // Notifications
  policeNotifiedAt?: string;
  policeRef?: string;
  socialWorkerNotifiedAt?: string;
  ofstedNotified: boolean;
  parentCarerNotified: boolean;

  // Risk
  triggerDescription: string;
  pushFactors: PushFactor[];
  pullFactors: PullFactor[];
  associatesInvolved: boolean;
  exploitationConcern: boolean;

  // Return
  returnInterview?: ReturnInterview;
  riskAssessmentUpdated: boolean;

  // Metadata
  loggedBy: string;
  loggedAt: string;
}

export interface ReturnInterview {
  status: ReturnInterviewStatus;
  interviewerId?: string;
  interviewerName?: string;
  interviewDate?: string;
  isIndependent: boolean;          // should be independent of the home
  childAccount: string;
  pushFactorsIdentified: PushFactor[];
  pullFactorsIdentified: PullFactor[];
  safeguardingConcerns: string[];
  actionsTaken: string[];
  referralsMade: string[];
  childAgreesToSafetyPlan: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface EpisodeComplianceResult {
  episodeId: string;
  childName: string;
  isCompliant: boolean;
  issues: string[];
  policeNotifiedWithinProtocol: boolean;
  returnInterviewWithin72h: boolean;
  riskAssessmentUpdated: boolean;
  ofstedNotified: boolean;
}

export interface PatternAnalysis {
  childId: string;
  childName: string;
  totalEpisodes: number;
  episodesInLast90Days: number;
  averageDurationMinutes: number;
  mostCommonTime: string;           // e.g., "evening" | "night" | "school_hours"
  pushFactorFrequency: { factor: PushFactor; count: number }[];
  pullFactorFrequency: { factor: PullFactor; count: number }[];
  escalating: boolean;              // episodes increasing in frequency/risk
  exploitationIndicators: number;
  preventionRecommendations: string[];
  riskLevel: "low" | "medium" | "high" | "very_high";
}

export interface HomeMetrics {
  homeId: string;
  totalEpisodes: number;
  activeEpisodes: number;
  episodesThisMonth: number;
  episodesThisQuarter: number;
  returnInterviewCompliance: number | null;  // %, null when no episode has closed
  averageResponseMinutes: number | null;     // time to police notification, null when none notified
  childrenWithEpisodes: number;
  repeatMissers: number;               // children with 3+ episodes
  exploitationConcerns: number;
  complianceRate: number | null;       // %, null when there are no episodes
}

// ── Configuration ──────────────────────────────────────────────────────────

const POLICE_NOTIFICATION_MINUTES = 60;    // Must notify within 1 hour (local protocol)
const RETURN_INTERVIEW_HOURS = 72;         // Must offer within 72 hours
const REPEAT_THRESHOLD = 3;               // 3+ episodes = repeat misser
const ESCALATION_WINDOW_DAYS = 90;        // Assess pattern over 90 days

// ── Core: Evaluate Episode Compliance ─────────────────────────────────────

export function evaluateEpisodeCompliance(
  episode: MissingEpisode,
): EpisodeComplianceResult {
  const issues: string[] = [];

  // Police notification timeliness
  let policeNotifiedWithinProtocol = false;
  if (episode.policeNotifiedAt) {
    const reportedTime = new Date(episode.reportedMissingAt).getTime();
    const notifiedTime = new Date(episode.policeNotifiedAt).getTime();
    const minutesToNotify = (notifiedTime - reportedTime) / (60 * 1000);
    policeNotifiedWithinProtocol = minutesToNotify <= POLICE_NOTIFICATION_MINUTES;
    if (!policeNotifiedWithinProtocol) {
      issues.push(`Police notified ${Math.round(minutesToNotify)} minutes after report (protocol: ${POLICE_NOTIFICATION_MINUTES} min).`);
    }
  } else if (episode.status !== "cancelled" && episode.riskGrading !== "absent") {
    issues.push("Police not notified — required for all missing episodes.");
    policeNotifiedWithinProtocol = false;
  }

  // Return interview
  let returnInterviewWithin72h = false;
  if (episode.returnedAt && episode.returnInterview) {
    const ri = episode.returnInterview;
    if (ri.status === "completed" && ri.interviewDate) {
      const returnedTime = new Date(episode.returnedAt).getTime();
      const interviewTime = new Date(ri.interviewDate).getTime();
      const hoursToInterview = (interviewTime - returnedTime) / (60 * 60 * 1000);
      returnInterviewWithin72h = hoursToInterview <= RETURN_INTERVIEW_HOURS;
      if (!returnInterviewWithin72h) {
        issues.push(`Return interview conducted ${Math.round(hoursToInterview)}h after return (max: ${RETURN_INTERVIEW_HOURS}h).`);
      }
    } else if (ri.status === "refused") {
      returnInterviewWithin72h = true; // offered but refused = compliant
    } else if (ri.status === "not_conducted") {
      issues.push("Return interview not conducted — statutory requirement.");
    } else if (ri.status === "completed_late") {
      issues.push("Return interview conducted late (after 72h deadline).");
    }
  } else if (episode.returnedAt && !episode.returnInterview) {
    issues.push("Return interview not recorded.");
    returnInterviewWithin72h = false;
  }

  // Risk assessment
  const riskAssessmentUpdated = episode.riskAssessmentUpdated;
  if (!riskAssessmentUpdated && episode.status !== "cancelled") {
    issues.push("Risk assessment not updated following episode.");
  }

  // Ofsted notification (required for all missing episodes)
  if (!episode.ofstedNotified && episode.status !== "cancelled" && episode.riskGrading !== "absent") {
    issues.push("Ofsted not notified — statutory requirement for missing episodes.");
  }

  const isCompliant = issues.length === 0;

  return {
    episodeId: episode.id,
    childName: episode.childName,
    isCompliant,
    issues,
    policeNotifiedWithinProtocol,
    returnInterviewWithin72h,
    riskAssessmentUpdated,
    ofstedNotified: episode.ofstedNotified,
  };
}

// ── Core: Pattern Analysis ────────────────────────────────────────────────

export function analyzePattern(
  episodes: MissingEpisode[],
  childId: string,
  childName: string,
  now?: string,
): PatternAnalysis {
  const currentDate = now ? new Date(now) : new Date();
  const ninetyDaysAgo = new Date(currentDate.getTime() - ESCALATION_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const childEpisodes = episodes
    .filter(e => e.childId === childId && e.status !== "cancelled")
    .sort((a, b) => new Date(b.reportedMissingAt).getTime() - new Date(a.reportedMissingAt).getTime());

  const recentEpisodes = childEpisodes.filter(e => new Date(e.reportedMissingAt) >= ninetyDaysAgo);

  // Average duration
  const withDuration = childEpisodes.filter(e => e.durationMinutes != null);
  const averageDurationMinutes = withDuration.length > 0
    ? Math.round(withDuration.reduce((sum, e) => sum + (e.durationMinutes ?? 0), 0) / withDuration.length)
    : 0;

  // Time patterns
  const hours = childEpisodes.map(e => new Date(e.reportedMissingAt).getUTCHours());
  const eveningCount = hours.filter(h => h >= 17 && h < 22).length;
  const nightCount = hours.filter(h => h >= 22 || h < 6).length;
  const schoolCount = hours.filter(h => h >= 8 && h < 15).length;
  let mostCommonTime = "varied";
  if (eveningCount > nightCount && eveningCount > schoolCount) mostCommonTime = "evening";
  else if (nightCount > eveningCount && nightCount > schoolCount) mostCommonTime = "night";
  else if (schoolCount > eveningCount && schoolCount > nightCount) mostCommonTime = "school_hours";

  // Factor frequency
  const pushCounts = new Map<PushFactor, number>();
  const pullCounts = new Map<PullFactor, number>();
  for (const ep of childEpisodes) {
    for (const f of ep.pushFactors) pushCounts.set(f, (pushCounts.get(f) ?? 0) + 1);
    for (const f of ep.pullFactors) pullCounts.set(f, (pullCounts.get(f) ?? 0) + 1);
  }
  const pushFactorFrequency = Array.from(pushCounts.entries())
    .map(([factor, count]) => ({ factor, count }))
    .sort((a, b) => b.count - a.count);
  const pullFactorFrequency = Array.from(pullCounts.entries())
    .map(([factor, count]) => ({ factor, count }))
    .sort((a, b) => b.count - a.count);

  // Escalation detection
  const olderEpisodes = childEpisodes.filter(e => new Date(e.reportedMissingAt) < ninetyDaysAgo);
  const escalating = recentEpisodes.length > olderEpisodes.length ||
    recentEpisodes.some(e => e.riskGrading === "high" || e.riskGrading === "critical");

  // Exploitation indicators
  const exploitationIndicators = childEpisodes.filter(e => e.exploitationConcern).length;

  // Risk level
  let riskLevel: PatternAnalysis["riskLevel"];
  if (exploitationIndicators >= 2 || recentEpisodes.length >= 5) riskLevel = "very_high";
  else if (recentEpisodes.length >= 3 || escalating) riskLevel = "high";
  else if (recentEpisodes.length >= 2) riskLevel = "medium";
  else riskLevel = "low";

  // Recommendations
  const recommendations = generatePreventionRecommendations(
    childEpisodes.length,
    recentEpisodes.length,
    pushFactorFrequency,
    pullFactorFrequency,
    exploitationIndicators,
    escalating,
  );

  return {
    childId,
    childName,
    totalEpisodes: childEpisodes.length,
    episodesInLast90Days: recentEpisodes.length,
    averageDurationMinutes,
    mostCommonTime,
    pushFactorFrequency,
    pullFactorFrequency,
    escalating,
    exploitationIndicators,
    preventionRecommendations: recommendations,
    riskLevel,
  };
}

// ── Core: Home Metrics ────────────────────────────────────────────────────

export function calculateHomeMetrics(
  episodes: MissingEpisode[],
  homeId: string,
  now?: string,
): HomeMetrics {
  const currentDate = now ? new Date(now) : new Date();
  const thisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const thisQuarter = new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 3) * 3, 1);

  const homeEpisodes = episodes.filter(e => e.homeId === homeId && e.status !== "cancelled");

  const activeEpisodes = homeEpisodes.filter(e => e.status === "active").length;
  const episodesThisMonth = homeEpisodes.filter(e => new Date(e.reportedMissingAt) >= thisMonth).length;
  const episodesThisQuarter = homeEpisodes.filter(e => new Date(e.reportedMissingAt) >= thisQuarter).length;

  // Return interview compliance
  const returnedEpisodes = homeEpisodes.filter(e => e.returnedAt);
  const withRI = returnedEpisodes.filter(e =>
    e.returnInterview &&
    (e.returnInterview.status === "completed" || e.returnInterview.status === "refused"),
  );
  const returnInterviewCompliance = rateOf(withRI, returnedEpisodes);

  // Average response time
  const withPolice = homeEpisodes.filter(e => e.policeNotifiedAt);
  const totalResponseMinutes = withPolice.reduce((sum, e) => {
    const reported = new Date(e.reportedMissingAt).getTime();
    const notified = new Date(e.policeNotifiedAt!).getTime();
    return sum + (notified - reported) / (60 * 1000);
  }, 0);
  const averageResponseMinutes = withPolice.length > 0
    ? Math.round(totalResponseMinutes / withPolice.length)
    : null;

  // Unique children
  const uniqueChildren = new Set(homeEpisodes.map(e => e.childId));
  const childEpisodeCounts = new Map<string, number>();
  for (const ep of homeEpisodes) {
    childEpisodeCounts.set(ep.childId, (childEpisodeCounts.get(ep.childId) ?? 0) + 1);
  }
  const repeatMissers = Array.from(childEpisodeCounts.values()).filter(c => c >= REPEAT_THRESHOLD).length;

  // Exploitation concerns
  const exploitationConcerns = homeEpisodes.filter(e => e.exploitationConcern).length;

  // Overall compliance
  const complianceResults = homeEpisodes.map(evaluateEpisodeCompliance);
  const compliantCount = complianceResults.filter(r => r.isCompliant).length;
  const complianceRate = rate(compliantCount, homeEpisodes.length);

  return {
    homeId,
    totalEpisodes: homeEpisodes.length,
    activeEpisodes,
    episodesThisMonth,
    episodesThisQuarter,
    returnInterviewCompliance,
    averageResponseMinutes,
    childrenWithEpisodes: uniqueChildren.size,
    repeatMissers,
    exploitationConcerns,
    complianceRate,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────

function generatePreventionRecommendations(
  total: number,
  recent: number,
  pushFactors: { factor: PushFactor; count: number }[],
  pullFactors: { factor: PullFactor; count: number }[],
  exploitationCount: number,
  escalating: boolean,
): string[] {
  const recs: string[] = [];

  if (exploitationCount >= 2) {
    recs.push("URGENT: CSE/CCE mapping required. Refer to MACE panel. Update NRM if not already submitted.");
  }

  if (escalating) {
    recs.push("Escalating pattern — convene professionals meeting to review safety plan.");
  }

  const topPush = pushFactors[0];
  if (topPush) {
    const pushRecs: Partial<Record<PushFactor, string>> = {
      peer_influence: "Map peer group and assess risk. Consider contextual safeguarding approach.",
      placement_unhappy: "Conduct listening session. Review placement suitability.",
      mental_health: "Expedite therapeutic referral. Review CAMHS engagement.",
      substance_use: "Refer to substance misuse service. Harm reduction plan needed.",
      boredom: "Increase activities programme. Consult child about preferred activities.",
    };
    if (pushRecs[topPush.factor]) recs.push(pushRecs[topPush.factor]!);
  }

  const topPull = pullFactors[0];
  if (topPull) {
    const pullRecs: Partial<Record<PullFactor, string>> = {
      exploitation: "Disruption strategy needed. Liaise with police re: persons of concern.",
      peer_group: "Positive activities programme to provide alternative social connections.",
      family: "Review contact arrangements. Consider increased supervised contact.",
      substance_access: "Identify supply routes. Harm reduction and awareness sessions.",
    };
    if (pullRecs[topPull.factor]) recs.push(pullRecs[topPull.factor]!);
  }

  if (recent >= 3) {
    recs.push("Consider safety mapping with child. Update risk assessment to reflect pattern.");
  }

  if (total >= 5 && recs.length === 0) {
    recs.push("Persistent pattern — review all prevention strategies and consider multi-agency approach.");
  }

  return recs;
}

export function getRiskGradingLabel(grading: RiskGrading): string {
  const labels: Record<RiskGrading, string> = {
    absent: "Absent (Unauthorised)",
    low: "Missing — Low Risk",
    medium: "Missing — Medium Risk",
    high: "Missing — High Risk",
    critical: "Missing — Critical (Immediate Danger)",
  };
  return labels[grading];
}

export function getEpisodeStatusLabel(status: EpisodeStatus): string {
  const labels: Record<EpisodeStatus, string> = {
    active: "Currently Missing",
    found_safe: "Found Safe",
    found_harmed: "Found — Harm Identified",
    returned_self: "Returned (Self)",
    returned_police: "Returned by Police",
    returned_other: "Returned (Other)",
    cancelled: "Cancelled",
  };
  return labels[status];
}
