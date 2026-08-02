// ══════════════════════════════════════════════════════════════════════════════
// CARA — MANAGER PRACTICE PATTERNS API
// GET /api/v1/manager-practice-patterns
//
// Analyses all recent records (last 30 days of incidents, behaviour log, and
// missing episodes) for manager-level pattern signals. Returns an aggregated
// view grouped by child and pattern type.
//
// Pattern detection is implemented locally so this route works independently
// of the unmerged RPIE branch.
//
// Cara advises. Managers decide. Professionals remain accountable.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import { getYPName } from "@/lib/seed-data";
import type { ManagerPatternInsight, PatternInsightType } from "@/lib/cara-heart/types";

const DISCLAIMER =
  "Cara identifies patterns to support manager reflection. Managers remain fully accountable for all safeguarding decisions, professional judgements, and statutory notifications.";

// ── Severity mappers ──────────────────────────────────────────────────────────

function incidentRisk(severity: string): ManagerPatternInsight["riskLevel"] {
  if (severity === "critical") return "high";
  if (severity === "high")     return "high";
  if (severity === "medium")   return "medium";
  return "low";
}

function missingRisk(risk: string): ManagerPatternInsight["riskLevel"] {
  if (risk === "critical") return "high";
  if (risk === "high")     return "high";
  return "medium";
}

function cutoffDate(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return d.toISOString().slice(0, 10);
}

// ── Pattern detection ─────────────────────────────────────────────────────────

interface PracticeSignal {
  id: string;
  childId: string;
  date: string;
  type: "incident" | "behaviour" | "missing";
  severity: string;
  policeCalled: boolean;
  staffDebriefed: boolean;
  repairRecorded: boolean;
  managerConsulted: boolean;
  missingFromCare: boolean;
  riskLevel: string;
}

function detectPatternInsights(signal: PracticeSignal): ManagerPatternInsight[] {
  const today = signal.date;
  const insights: ManagerPatternInsight[] = [];

  // Incident / behaviour frequency
  if (signal.type === "incident" || signal.type === "behaviour") {
    const riskLevel = incidentRisk(signal.severity);
    insights.push({
      patternType: "incident_frequency" as PatternInsightType,
      childId: signal.childId,
      dateRange: { from: today, to: today },
      evidence: ["Single incident recorded — review in context of the child's recent history"],
      riskLevel,
      recommendedManagerActions: [
        "Review this incident alongside the child's recent record to identify any patterns.",
        "Consider whether the care plan or behaviour support plan needs to be updated.",
      ],
      supervisionPrompts: [
        "Is this child's presentation changing over time? In what direction?",
        "Are staff responses to this child consistent and plan-led?",
      ],
      planReviewNeeded: riskLevel === "high",
    });
  }

  // Police contact
  if (signal.policeCalled) {
    insights.push({
      patternType: "police_contact" as PatternInsightType,
      childId: signal.childId,
      dateRange: { from: today, to: today },
      evidence: ["Police contact recorded — review frequency and context across recent history"],
      riskLevel: "medium",
      recommendedManagerActions: [
        "Review all recent police contacts to understand whether a pattern is developing.",
        "Consider whether an anti-criminalisation strategy needs to be embedded in the placement plan.",
      ],
      supervisionPrompts: [
        "Is police involvement becoming normalised for this child?",
        "Is the team using the minimum necessary response to keep everyone safe?",
      ],
      planReviewNeeded: true,
    });
  }

  // Missing episode
  if (signal.missingFromCare) {
    const riskLevel = missingRisk(signal.riskLevel);
    insights.push({
      patternType: "missing_episode" as PatternInsightType,
      childId: signal.childId,
      dateRange: { from: today, to: today },
      evidence: ["Missing from care episode — review frequency, timing, triggers and return circumstances"],
      riskLevel,
      recommendedManagerActions: [
        "Review all recent missing episodes to identify patterns in timing, triggers, and protective factors.",
        "Ensure the missing from care plan is current, risk-rated, and known to all staff.",
      ],
      supervisionPrompts: [
        "What is driving this child's missing episodes?",
        "Is this home a place the child feels safe to return to?",
      ],
      planReviewNeeded: true,
    });
  }

  // Staff debrief gap on significant records
  const isSeverityHigh = ["high", "critical", "severe", "moderate"].includes(signal.severity);
  if (!signal.staffDebriefed && isSeverityHigh) {
    insights.push({
      patternType: "staff_stress" as PatternInsightType,
      childId: signal.childId,
      dateRange: { from: today, to: today },
      evidence: ["Significant record without staff debrief recorded"],
      riskLevel: "low",
      recommendedManagerActions: [
        "Review whether staff debriefs are being completed consistently after high-intensity incidents.",
        "Consider whether the team needs a reflective discussion about this child's current presentation.",
      ],
      supervisionPrompts: [
        "Are staff receiving adequate support and debriefing after difficult incidents?",
        "Is compassion fatigue or burnout risk visible in the team?",
      ],
      planReviewNeeded: false,
    });
  }

  // Recording quality gap
  if (isSeverityHigh && !signal.repairRecorded && !signal.managerConsulted) {
    insights.push({
      patternType: "recording_quality" as PatternInsightType,
      childId: signal.childId,
      dateRange: { from: today, to: today },
      evidence: ["Significant record submitted without repair or manager oversight noted"],
      riskLevel: "low",
      recommendedManagerActions: [
        "Review whether significant records are being completed to the required standard.",
        "Ensure staff understand the recording expectations for this type of event.",
      ],
      supervisionPrompts: [
        "Is recording quality consistent across the team after significant events?",
        "Are staff clear about what must be included in a significant record?",
      ],
      planReviewNeeded: false,
    });
  }

  return insights;
}

// ── Store → PracticeSignal converters ─────────────────────────────────────────

function incidentsToSignals(incidents: any[]): PracticeSignal[] {
  const cutoff = cutoffDate(30);
  return incidents
    .filter((inc) => inc.date >= cutoff)
    .map((inc) => ({
      id: inc.id as string,
      childId: inc.child_id as string,
      date: inc.date as string,
      type: "incident" as const,
      severity: (inc.severity ?? "low") as string,
      policeCalled: (inc.notifications ?? []).some(
        (n: any) => (n.role as string)?.toLowerCase().includes("police"),
      ),
      staffDebriefed: inc.status === "closed",
      repairRecorded: !!inc.lessons_learned,
      managerConsulted: !!inc.oversight_by,
      missingFromCare: false,
      riskLevel: (inc.severity ?? "low") as string,
    }));
}

function behaviourLogToSignals(entries: any[]): PracticeSignal[] {
  const cutoff = cutoffDate(30);
  return entries
    .filter((e) => e.direction === "concerning" && e.date >= cutoff)
    .map((e) => ({
      id: e.id as string,
      childId: e.child_id as string,
      date: e.date as string,
      type: "behaviour" as const,
      severity: (e.intensity ?? "low") as string,
      policeCalled: false,
      staffDebriefed: false,
      repairRecorded: !!e.outcome && (e.outcome as string).toLowerCase().includes("apolog"),
      managerConsulted: false,
      missingFromCare: false,
      riskLevel: (e.intensity ?? "low") as string,
    }));
}

function missingEpisodesToSignals(episodes: any[]): PracticeSignal[] {
  const cutoff = cutoffDate(30);
  return episodes
    .filter((ep) => ep.date_missing >= cutoff)
    .map((ep) => ({
      id: ep.id as string,
      childId: ep.child_id as string,
      date: ep.date_missing as string,
      type: "missing" as const,
      severity: (ep.risk_level ?? "medium") as string,
      policeCalled: ep.reported_to_police ?? false,
      staffDebriefed: ep.status === "closed",
      repairRecorded: ep.return_interview_completed ?? false,
      managerConsulted: true,
      missingFromCare: true,
      riskLevel: (ep.risk_level ?? "medium") as string,
    }));
}

// ── Aggregation types ─────────────────────────────────────────────────────────

interface ChildPatternSummary {
  childId: string;
  childName: string;
  totalRecords: number;
  patternInsights: ManagerPatternInsight[];
  patternTypes: PatternInsightType[];
  highRiskCount: number;
  planReviewNeeded: boolean;
}

interface PatternTypeCount {
  patternType: PatternInsightType;
  count: number;
  affectedChildren: string[];
  highRiskCount: number;
}

function aggregateInsights(
  insights: ManagerPatternInsight[],
  signals: PracticeSignal[],
): {
  childSummaries: ChildPatternSummary[];
  patternBreakdown: PatternTypeCount[];
} {
  const byChild: Record<string, ManagerPatternInsight[]> = {};
  const byType: Record<string, PatternTypeCount> = {};

  for (const insight of insights) {
    const cid = insight.childId ?? "";
    if (!cid) continue;

    if (!byChild[cid]) byChild[cid] = [];
    byChild[cid].push(insight);

    const pt = insight.patternType;
    if (!byType[pt]) {
      byType[pt] = { patternType: pt, count: 0, affectedChildren: [], highRiskCount: 0 };
    }
    byType[pt].count++;
    if (!byType[pt].affectedChildren.includes(cid)) {
      byType[pt].affectedChildren.push(cid);
    }
    if (insight.riskLevel === "high") {
      byType[pt].highRiskCount++;
    }
  }

  const childSummaries: ChildPatternSummary[] = Object.entries(byChild).map(([childId, ci]) => ({
    childId,
    childName: getYPName(childId),
    totalRecords: signals.filter((s) => s.childId === childId).length,
    patternInsights: ci,
    patternTypes: [...new Set(ci.map((i) => i.patternType))],
    highRiskCount: ci.filter((i) => i.riskLevel === "high").length,
    planReviewNeeded: ci.some((i) => i.planReviewNeeded),
  }));

  childSummaries.sort(
    (a, b) => b.highRiskCount - a.highRiskCount || b.patternInsights.length - a.patternInsights.length,
  );

  const patternBreakdown = Object.values(byType).sort(
    (a, b) => b.highRiskCount - a.highRiskCount || b.count - a.count,
  );

  return { childSummaries, patternBreakdown };
}

// ── GET handler ───────────────────────────────────────────────────────────────

export async function GET() {
  const [behaviourLogList, incidentsList, missingEpisodesList] = await Promise.all([
      dal.behaviourLog.findAll(),
      dal.incidents.findAll(),
      dal.missingEpisodes.findAll(),
    ]);

  const signals: PracticeSignal[] = [
    ...incidentsToSignals(incidentsList ?? []),
    ...behaviourLogToSignals(behaviourLogList ?? []),
    ...missingEpisodesToSignals(missingEpisodesList ?? []),
  ];

  const allInsights: ManagerPatternInsight[] = signals.flatMap(detectPatternInsights);

  const { childSummaries, patternBreakdown } = aggregateInsights(allInsights, signals);

  const summary = {
    totalRecordsAnalysed: signals.length,
    totalInsights: allInsights.length,
    childrenWithPatterns: childSummaries.length,
    planReviewsNeeded: childSummaries.filter((c) => c.planReviewNeeded).length,
    highRiskInsights: allInsights.filter((i) => i.riskLevel === "high").length,
    periodDays: 30,
  };

  return NextResponse.json({
    data: { summary, childSummaries, patternBreakdown, disclaimer: DISCLAIMER },
  });
}
