// ══════════════════════════════════════════════════════════════════════════════
// Cara — KEY WORK SESSION QUALITY
//
// Analyses key work session records to surface:
//   - Frequency compliance (are sessions happening regularly?)
//   - Coverage of care plan objectives
//   - Child voice capture quality
//   - Action completion from previous sessions
//   - Staff distribution (who is doing key work?)
//   - Session quality indicators
//
// CHR 2015 Reg 14 (Care Plans)
// CHR 2015 Reg 7 (Child's Views)
// SCCIF: Experiences and Progress of Children
//
// Pure function — no side effects, no API calls.
// ══════════════════════════════════════════════════════════════════════════════

import { below, formatRate, meanOf, meets, rate, rateOf } from "@/lib/metrics/rate";

// ── Types ────────────────────────────────────────────────────────────────────

export interface KeyWorkSession {
  id: string;
  childId: string;
  childName: string;
  date: string;
  staffId: string;
  staffName: string;
  durationMinutes: number;
  topics: string[];
  linkedObjectiveIds: string[];
  hasChildVoice: boolean;
  childEngagement: "high" | "moderate" | "low" | "refused";
  actionsSet: number;
  actionsCompleted: number;        // From previous session
  previousActionsTotal: number;    // Total actions from previous session
  notes?: string;
}

export interface KeyWorkConfig {
  childId: string;
  childName: string;
  keyWorker: string;              // Primary key worker staff ID
  keyWorkerName: string;
  frequencyDays: number;          // Expected interval (e.g., 7 for weekly)
  carePlanObjectiveIds: string[];  // Objectives to cover
  carePlanObjectiveTitles: string[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface KeyWorkAnalysis {
  homeId: string;
  analysisDate: string;
  windowDays: number;

  // Overview
  totalSessions: number;
  childrenCovered: number;
  childrenTotal: number;
  overallCompliancePercent: number | null;

  // Per-child
  childAnalyses: ChildKeyWorkAnalysis[];

  // Team metrics — null where nothing has been recorded to measure
  teamMetrics: {
    averageSessionDuration: number | null;
    childVoiceRate: number | null;
    actionCompletionRate: number | null;
    objectiveCoverageRate: number | null;
  };

  // Alerts
  alerts: KeyWorkAlert[];

  // Regulatory status
  regulatoryStatus: {
    compliant: boolean;
    issues: string[];
    strengths: string[];
  };
}

export interface ChildKeyWorkAnalysis {
  childId: string;
  childName: string;
  totalSessions: number;
  lastSessionDate: string | null;
  daysSinceLastSession: number | null;
  isOverdue: boolean;
  frequencyCompliant: boolean;
  averageDuration: number | null;
  childVoiceRate: number | null;
  engagementProfile: { high: number; moderate: number; low: number; refused: number };
  objectivesCovered: string[];
  objectivesNotCovered: string[];
  objectiveCoveragePercent: number | null;   // null = no objectives on the care plan to cover
  actionCompletionRate: number | null;       // null = no actions were set to complete
  primaryKeyWorkerPercent: number | null;    // % of sessions done by designated key worker
}

export interface KeyWorkAlert {
  severity: "critical" | "high" | "medium" | "advisory";
  category: "frequency" | "voice" | "coverage" | "quality" | "engagement";
  childId?: string;
  childName?: string;
  title: string;
  description: string;
  action: string;
  regulation?: string;
}

// ── Analyser ────────────────────────────────────────────────────────────────

export function analyseKeyWork(
  sessions: KeyWorkSession[],
  configs: KeyWorkConfig[],
  homeId: string = "home_oak",
  windowDays: number = 28,
): KeyWorkAnalysis {
  const today = new Date().toISOString().slice(0, 10);
  const alerts: KeyWorkAlert[] = [];

  // Per-child analysis
  const childAnalyses: ChildKeyWorkAnalysis[] = configs.map((config) => {
    const childSessions = sessions
      .filter((s) => s.childId === config.childId)
      .sort((a, b) => b.date.localeCompare(a.date)); // newest first

    const totalSessions = childSessions.length;
    const lastSessionDate = childSessions[0]?.date ?? null;
    const daysSinceLast = lastSessionDate ? dateDiff(lastSessionDate, today) : null;
    const isOverdue = daysSinceLast !== null ? daysSinceLast > config.frequencyDays : true;

    // Frequency compliance (sessions within window / expected sessions)
    const expectedSessions = Math.floor(windowDays / config.frequencyDays);
    const frequencyCompliant = totalSessions >= expectedSessions;

    // Average duration
    const averageDuration = meanOf(childSessions.map((sess) => sess.durationMinutes));

    // Child voice capture rate
    const withVoice = childSessions.filter((s) => s.hasChildVoice).length;
    const childVoiceRate = rate(withVoice, totalSessions);

    // Engagement profile
    const engagementProfile = { high: 0, moderate: 0, low: 0, refused: 0 };
    for (const s of childSessions) {
      engagementProfile[s.childEngagement]++;
    }

    // Objective coverage
    const allLinkedObjectives = new Set(childSessions.flatMap((s) => s.linkedObjectiveIds));
    const objectivesCovered = config.carePlanObjectiveTitles.filter((_, i) =>
      allLinkedObjectives.has(config.carePlanObjectiveIds[i])
    );
    const objectivesNotCovered = config.carePlanObjectiveTitles.filter((_, i) =>
      !allLinkedObjectives.has(config.carePlanObjectiveIds[i])
    );
    const objectiveCoveragePercent = rate(objectivesCovered.length, config.carePlanObjectiveIds.length);

    // Action completion
    const totalPrevActions = childSessions.reduce((s, sess) => s + sess.previousActionsTotal, 0);
    const completedPrevActions = childSessions.reduce((s, sess) => s + sess.actionsCompleted, 0);
    const actionCompletionRate = rate(completedPrevActions, totalPrevActions);

    // Key worker distribution
    const byKeyWorker = childSessions.filter((s) => s.staffId === config.keyWorker).length;
    const primaryKeyWorkerPercent = rate(byKeyWorker, totalSessions);

    // Generate child-specific alerts
    if (isOverdue && daysSinceLast !== null && daysSinceLast > config.frequencyDays * 2) {
      alerts.push({
        severity: "high",
        category: "frequency",
        childId: config.childId,
        childName: config.childName,
        title: `Key work significantly overdue for ${config.childName}`,
        description: `Last session ${daysSinceLast} days ago (expected every ${config.frequencyDays} days).`,
        action: "Schedule key work session urgently. Record reason for gap.",
        regulation: "CHR 2015 Reg 14 (Care Plans)",
      });
    } else if (isOverdue) {
      alerts.push({
        severity: "medium",
        category: "frequency",
        childId: config.childId,
        childName: config.childName,
        title: `Key work overdue for ${config.childName}`,
        description: `Last session ${daysSinceLast ?? "unknown"} days ago (expected every ${config.frequencyDays} days).`,
        action: "Schedule key work session this week.",
      });
    }

    if (below(childVoiceRate, 50) && totalSessions >= 2) {
      alerts.push({
        severity: "medium",
        category: "voice",
        childId: config.childId,
        childName: config.childName,
        title: `Low child voice capture for ${config.childName}`,
        description: `Only ${formatRate(childVoiceRate)} of sessions record the child's direct voice.`,
        action: "Ensure the child's words, views and feelings are recorded in their own language.",
        regulation: "CHR 2015 Reg 7 (Child's Views)",
      });
    }

    if (below(objectiveCoveragePercent, 60) && config.carePlanObjectiveIds.length >= 2) {
      alerts.push({
        severity: "medium",
        category: "coverage",
        childId: config.childId,
        childName: config.childName,
        title: `Care plan objectives not covered in key work for ${config.childName}`,
        description: `Only ${formatRate(objectiveCoveragePercent)} of objectives discussed. Missing: ${objectivesNotCovered.slice(0, 2).join(", ")}.`,
        action: "Plan key work sessions to cover all objectives over a cycle.",
        regulation: "CHR 2015 Reg 14",
      });
    }

    if (engagementProfile.refused >= 2 || engagementProfile.low >= 3) {
      alerts.push({
        severity: "medium",
        category: "engagement",
        childId: config.childId,
        childName: config.childName,
        title: `Low engagement in key work — ${config.childName}`,
        description: `${engagementProfile.refused} refusals and ${engagementProfile.low} low-engagement sessions.`,
        action: "Review approach. Consider different timing, activities, or setting for key work.",
      });
    }

    return {
      childId: config.childId,
      childName: config.childName,
      totalSessions,
      lastSessionDate,
      daysSinceLastSession: daysSinceLast,
      isOverdue,
      frequencyCompliant,
      averageDuration,
      childVoiceRate,
      engagementProfile,
      objectivesCovered,
      objectivesNotCovered,
      objectiveCoveragePercent,
      actionCompletionRate,
      primaryKeyWorkerPercent,
    };
  });

  // Team metrics
  const allSessions = sessions.length;
  const avgDuration = meanOf(sessions.map((sess) => sess.durationMinutes));
  const voiceRate = rateOf(sessions.filter((s) => s.hasChildVoice), sessions);
  const totalPrev = sessions.reduce((s, sess) => s + sess.previousActionsTotal, 0);
  const completedPrev = sessions.reduce((s, sess) => s + sess.actionsCompleted, 0);
  const actionRate = rate(completedPrev, totalPrev);

  const allObjectiveIds = configs.flatMap((c) => c.carePlanObjectiveIds);
  const coveredIds = new Set(sessions.flatMap((s) => s.linkedObjectiveIds));
  const objCoverage = rate(allObjectiveIds.filter((id) => coveredIds.has(id)).length, allObjectiveIds.length);

  // Overall compliance
  const childrenCovered = childAnalyses.filter((c) => c.totalSessions > 0).length;
  const compliantChildren = childAnalyses.filter((c) => c.frequencyCompliant).length;
  const overallCompliance = rate(compliantChildren, configs.length);

  // Children with zero sessions
  const noSessions = childAnalyses.filter((c) => c.totalSessions === 0);
  if (noSessions.length > 0) {
    alerts.push({
      severity: "critical",
      category: "frequency",
      title: `${noSessions.length} child(ren) with no key work in ${windowDays} days`,
      description: `${noSessions.map((c) => c.childName).join(", ")} — no recorded key work sessions.`,
      action: "Investigate immediately. Key work is a core regulatory requirement.",
      regulation: "CHR 2015 Reg 14",
    });
  }

  // Regulatory status
  const issues: string[] = [];
  const strengths: string[] = [];

  // An empty register is the finding, not a pass — compliance cannot be asserted
  // from nothing recorded.
  if (allSessions === 0) issues.push(`No key work sessions recorded in ${windowDays} days`);

  const overdueChildren = childAnalyses.filter((c) => c.isOverdue);
  if (overdueChildren.length > 0) issues.push(`${overdueChildren.length} child(ren) overdue key work`);
  if (below(voiceRate, 70)) issues.push(`Low child voice capture rate (${formatRate(voiceRate)})`);
  if (below(objCoverage, 70)) issues.push(`Care plan objectives not adequately covered (${formatRate(objCoverage)})`);

  if (meets(overallCompliance, 100)) strengths.push("All children receiving key work at expected frequency");
  if (meets(voiceRate, 90)) strengths.push("Excellent child voice capture in key work");
  if (meets(actionRate, 80)) strengths.push(`Strong action completion rate (${formatRate(actionRate)})`);
  if (meets(objCoverage, 100)) strengths.push("All care plan objectives covered in key work");

  return {
    homeId,
    analysisDate: today,
    windowDays,
    totalSessions: allSessions,
    childrenCovered,
    childrenTotal: configs.length,
    overallCompliancePercent: overallCompliance,
    childAnalyses: childAnalyses.sort((a, b) => (a.daysSinceLastSession ?? 999) - (b.daysSinceLastSession ?? 999)),
    teamMetrics: {
      averageSessionDuration: avgDuration,
      childVoiceRate: voiceRate,
      actionCompletionRate: actionRate,
      objectiveCoverageRate: objCoverage,
    },
    alerts: alerts.sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity)),
    regulatoryStatus: {
      compliant: issues.length === 0,
      issues,
      strengths,
    },
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function dateDiff(dateA: string, dateB: string): number {
  return Math.round((new Date(dateB).getTime() - new Date(dateA).getTime()) / 86400000);
}

function severityOrder(s: "critical" | "high" | "medium" | "advisory"): number {
  switch (s) {
    case "critical": return 0;
    case "high": return 1;
    case "medium": return 2;
    case "advisory": return 3;
  }
}
