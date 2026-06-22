// ─────────────────────────────────────────────────────────────────────────────
// Home Outcome Overview
//
// The whole-home / manager-and-inspector view of Outcome Intelligence. A PURE
// aggregator: it runs the per-child Outcome Intelligence Engine across every
// child in the home and answers the questions a Registered Manager (or Ofsted
// inspector) actually asks — "across this home, whose outcomes need us most, and
// where are the patterns?" It ranks children by who needs focus, and builds a
// home-wide domain heatmap (how many children are on track / progressing /
// needing focus in each outcome domain).
//
// No new data, no duplication — it composes buildOutcomeIntelligence, which is
// itself a pure projection. Deterministic (injected `now`) → prod-safe.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  KeyWorkingSession,
  FamilyTimeSession,
  MissingEpisode,
  PositiveAchievement,
  ReturnInterview,
  EducationRecord,
  LACReview,
} from "@/types/extended";
import type { Incident } from "@/types";
import {
  buildOutcomeIntelligence,
  type OutcomeStatus,
  type OutcomeDirection,
  type OutcomeDomainKey,
} from "./outcome-intelligence-engine";

export interface HomeOutcomeChild {
  childId: string;
  childName: string;
  overallStatus: OutcomeStatus;
  overallTrajectory: OutcomeDirection;
  domainsOnTrack: number;
  domainsImproving: number;
  domainsDeclining: number;
  domainsNeedingFocus: number;
  /** Higher = needs us more. Drives the ranking. */
  priority: number;
  /** Headline of the most pressing domain (or the overall headline). */
  topConcern: string;
  /** Per-domain status, in fixed domain order — the child's heatmap row. */
  domainStatuses: Record<OutcomeDomainKey, OutcomeStatus>;
}

export interface HomeOutcomeDomainSummary {
  key: OutcomeDomainKey;
  label: string;
  onTrack: number;
  progressing: number;
  needsFocus: number;
  improving: number;
  declining: number;
}

export interface HomeOutcomeOverview {
  generatedAt: string;
  windowDays: number;
  headline: string;
  childCount: number;
  childrenOnTrack: number;
  childrenNeedingFocus: number;
  childrenImproving: number;
  /** Home-wide heatmap, one row per outcome domain. */
  domainSummaries: HomeOutcomeDomainSummary[];
  /** Children ranked most-needing-focus first. */
  children: HomeOutcomeChild[];
}

export interface HomeOutcomeInput {
  now: string;
  windowDays?: number;
  children: { id: string; name: string; trustedAdults: string[] }[];
  keyWorkingSessions: KeyWorkingSession[];
  incidents: Incident[];
  missingEpisodes: MissingEpisode[];
  educationRecords: EducationRecord[];
  positiveAchievements: PositiveAchievement[];
  familyTimeSessions: FamilyTimeSession[];
  returnInterviews: ReturnInterview[];
  lacReviews: LACReview[];
}

const STATUS_WEIGHT: Record<OutcomeStatus, number> = {
  needs_focus: 3,
  progressing: 1,
  on_track: 0,
};

const DOMAIN_ORDER: { key: OutcomeDomainKey; label: string }[] = [
  { key: "safety", label: "Safety" },
  { key: "education", label: "Education & learning" },
  { key: "wellbeing", label: "Emotional wellbeing" },
  { key: "relationships", label: "Relationships & belonging" },
  { key: "voice", label: "Voice & participation" },
];

export function buildHomeOutcomeOverview(input: HomeOutcomeInput): HomeOutcomeOverview {
  const windowDays = input.windowDays && input.windowDays > 0 ? input.windowDays : 90;

  const children: HomeOutcomeChild[] = input.children.map((c) => {
    const o = buildOutcomeIntelligence({
      childId: c.id,
      childName: c.name,
      now: input.now,
      windowDays,
      keyWorkingSessions: input.keyWorkingSessions,
      incidents: input.incidents,
      missingEpisodes: input.missingEpisodes,
      educationRecords: input.educationRecords,
      positiveAchievements: input.positiveAchievements,
      familyTimeSessions: input.familyTimeSessions,
      returnInterviews: input.returnInterviews,
      lacReviews: input.lacReviews,
      trustedAdults: c.trustedAdults,
    });

    const domainStatuses = DOMAIN_ORDER.reduce(
      (acc, d) => {
        acc[d.key] = o.domains.find((x) => x.key === d.key)?.status ?? "progressing";
        return acc;
      },
      {} as Record<OutcomeDomainKey, OutcomeStatus>,
    );

    // The most pressing domain headline: a needs_focus domain if any, else a
    // declining one, else the overall headline.
    const worst =
      o.domains.find((d) => d.status === "needs_focus") ??
      o.domains.find((d) => d.direction === "declining" && d.hasEvidence);
    const topConcern = worst ? `${worst.label}: ${worst.headline}` : o.headline;

    const priority =
      o.domainsNeedingFocus * 3 +
      o.domainsDeclining +
      STATUS_WEIGHT[o.overallStatus] +
      (o.overallTrajectory === "declining" ? 1 : 0);

    return {
      childId: c.id,
      childName: c.name,
      overallStatus: o.overallStatus,
      overallTrajectory: o.overallTrajectory,
      domainsOnTrack: o.domainsOnTrack,
      domainsImproving: o.domainsImproving,
      domainsDeclining: o.domainsDeclining,
      domainsNeedingFocus: o.domainsNeedingFocus,
      priority,
      topConcern,
      domainStatuses,
    };
  });

  // Most needing focus first; stable tie-break by name.
  children.sort((a, b) => b.priority - a.priority || a.childName.localeCompare(b.childName));

  // Home-wide domain heatmap.
  const domainSummaries: HomeOutcomeDomainSummary[] = DOMAIN_ORDER.map((d) => {
    const summary: HomeOutcomeDomainSummary = {
      key: d.key,
      label: d.label,
      onTrack: 0,
      progressing: 0,
      needsFocus: 0,
      improving: 0,
      declining: 0,
    };
    for (const child of children) {
      const st = child.domainStatuses[d.key];
      if (st === "on_track") summary.onTrack += 1;
      else if (st === "needs_focus") summary.needsFocus += 1;
      else summary.progressing += 1;
    }
    return summary;
  });

  const childrenOnTrack = children.filter((c) => c.overallStatus === "on_track").length;
  const childrenNeedingFocus = children.filter((c) => c.overallStatus === "needs_focus").length;
  const childrenImproving = children.filter((c) => c.overallTrajectory === "improving").length;

  const headline =
    children.length === 0
      ? "No children to report on yet."
      : childrenNeedingFocus > 0
        ? `${childrenNeedingFocus} of ${children.length} children need focus on their outcomes — see the priority list below.`
        : childrenImproving > 0
          ? `All ${children.length} children's outcomes are on track or progressing, ${childrenImproving} improving.`
          : `All ${children.length} children's outcomes are on track or progressing.`;

  return {
    generatedAt: input.now,
    windowDays,
    headline,
    childCount: children.length,
    childrenOnTrack,
    childrenNeedingFocus,
    childrenImproving,
    domainSummaries,
    children,
  };
}
