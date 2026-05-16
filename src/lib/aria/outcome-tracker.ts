// ══════════════════════════════════════════════════════════════════════════════
// ARIA — OUTCOME TRACKER
//
// Tracks whether care plan outcomes are being achieved by analysing daily
// evidence. Maps indicators of progress (or regression) against defined
// outcome objectives. Provides a child-centred view of whether the
// placement is delivering what it should.
//
// CHR 2015 Reg 6 (Quality of Care) / Reg 14 (Care Plans)
// SCCIF: Progress and Outcomes
//
// Pure function — no side effects, no API calls.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────────────────────

export interface OutcomeObjective {
  id: string;
  title: string;
  category: OutcomeCategory;
  targetDescription: string;
  startDate: string;
  targetDate?: string;
  indicators: ProgressIndicator[];
  currentStatus: "on_track" | "at_risk" | "off_track" | "achieved" | "not_started";
}

export type OutcomeCategory =
  | "education"
  | "emotional_wellbeing"
  | "physical_health"
  | "family_relationships"
  | "social_skills"
  | "independence"
  | "identity"
  | "safety";

export interface ProgressIndicator {
  id: string;
  description: string;
  measureType: "frequency" | "scale" | "binary" | "attendance";
  target: number;
  current: number;
  trend: "improving" | "stable" | "declining";
  lastUpdated: string;
}

export interface EvidenceEntry {
  id: string;
  date: string;
  objectiveId: string;
  indicatorId?: string;
  type: "positive" | "negative" | "neutral";
  content: string;
  source: string;       // "daily_log", "key_work", "school_report", etc.
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface OutcomeAnalysis {
  childId: string;
  childName: string;
  analysedAt: string;
  totalObjectives: number;
  overallProgress: number;        // 0-100
  progressGrade: "excellent" | "good" | "mixed" | "concerning" | "insufficient_data";

  objectives: ObjectiveAnalysis[];
  categoryScores: CategoryScore[];
  recentEvidence: EvidenceEntry[];
  alerts: OutcomeAlert[];
  celebrations: string[];
  recommendations: string[];
}

export interface ObjectiveAnalysis {
  objective: OutcomeObjective;
  progressPercent: number;
  evidenceCount: number;
  recentPositive: number;
  recentNegative: number;
  daysToTarget: number | null;
  onTrack: boolean;
  summary: string;
}

export interface CategoryScore {
  category: OutcomeCategory;
  label: string;
  score: number;                  // 0-100
  objectiveCount: number;
  trend: "improving" | "stable" | "declining";
}

export interface OutcomeAlert {
  severity: "high" | "medium" | "low";
  objectiveId: string;
  objectiveTitle: string;
  message: string;
  action: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<OutcomeCategory, string> = {
  education: "Education & Learning",
  emotional_wellbeing: "Emotional Wellbeing",
  physical_health: "Physical Health",
  family_relationships: "Family & Relationships",
  social_skills: "Social Skills",
  independence: "Independence & Life Skills",
  identity: "Identity & Self-esteem",
  safety: "Staying Safe",
};

// ── Tracker ─────────────────────────────────────────────────────────────────

export function trackOutcomes(
  childId: string,
  childName: string,
  objectives: OutcomeObjective[],
  evidence: EvidenceEntry[],
): OutcomeAnalysis {
  const today = new Date().toISOString().slice(0, 10);
  const alerts: OutcomeAlert[] = [];
  const celebrations: string[] = [];
  const recommendations: string[] = [];

  // Analyse each objective
  const objectiveAnalyses: ObjectiveAnalysis[] = objectives.map((obj) => {
    const objEvidence = evidence.filter((e) => e.objectiveId === obj.id);
    const recentEvidence = objEvidence.filter((e) => dateDiff(e.date, today) <= 14);
    const recentPositive = recentEvidence.filter((e) => e.type === "positive").length;
    const recentNegative = recentEvidence.filter((e) => e.type === "negative").length;

    // Calculate progress from indicators
    let progressPercent = 0;
    if (obj.indicators.length > 0) {
      const indicatorProgress = obj.indicators.map((ind) => {
        if (ind.target === 0) return 100;
        return Math.min(100, Math.round((ind.current / ind.target) * 100));
      });
      progressPercent = Math.round(
        indicatorProgress.reduce((sum, p) => sum + p, 0) / indicatorProgress.length
      );
    } else if (obj.currentStatus === "achieved") {
      progressPercent = 100;
    } else if (obj.currentStatus === "on_track") {
      progressPercent = 70;
    } else if (obj.currentStatus === "at_risk") {
      progressPercent = 40;
    } else if (obj.currentStatus === "off_track") {
      progressPercent = 20;
    }

    // Days to target
    const daysToTarget = obj.targetDate ? dateDiff(today, obj.targetDate) : null;

    // Determine if on track
    const onTrack = progressPercent >= 60 || obj.currentStatus === "on_track" || obj.currentStatus === "achieved";

    // Generate alerts
    if (obj.currentStatus === "off_track" || (daysToTarget !== null && daysToTarget < 14 && progressPercent < 50)) {
      alerts.push({
        severity: "high",
        objectiveId: obj.id,
        objectiveTitle: obj.title,
        message: daysToTarget !== null && daysToTarget < 14
          ? `Target date approaching (${daysToTarget} days) but progress is only ${progressPercent}%`
          : `Objective is off track (${progressPercent}% progress)`,
        action: "Review objective in next key work session. Consider whether target is realistic or approach needs changing.",
      });
    } else if (obj.currentStatus === "at_risk") {
      alerts.push({
        severity: "medium",
        objectiveId: obj.id,
        objectiveTitle: obj.title,
        message: `Objective at risk — progress has slowed`,
        action: "Monitor closely and discuss with young person what barriers they are facing.",
      });
    }

    // Celebrations
    if (obj.currentStatus === "achieved") {
      celebrations.push(`${obj.title} — achieved!`);
    } else if (progressPercent >= 80 && obj.currentStatus !== "achieved") {
      celebrations.push(`${obj.title} — nearly there (${progressPercent}%)`);
    }

    // Generate summary
    let summary: string;
    if (obj.currentStatus === "achieved") {
      summary = "Achieved. Well done!";
    } else if (onTrack) {
      summary = `On track at ${progressPercent}%. ${recentPositive > 0 ? `${recentPositive} positive evidence in last 2 weeks.` : ""}`;
    } else {
      summary = `Needs attention at ${progressPercent}%. ${recentNegative > 0 ? `${recentNegative} concerns in last 2 weeks.` : ""}`;
    }

    return {
      objective: obj,
      progressPercent,
      evidenceCount: objEvidence.length,
      recentPositive,
      recentNegative,
      daysToTarget,
      onTrack,
      summary: summary.trim(),
    };
  });

  // Category scores
  const categories = [...new Set(objectives.map((o) => o.category))];
  const categoryScores: CategoryScore[] = categories.map((cat) => {
    const catObjectives = objectiveAnalyses.filter((oa) => oa.objective.category === cat);
    const avgProgress = catObjectives.length > 0
      ? Math.round(catObjectives.reduce((sum, o) => sum + o.progressPercent, 0) / catObjectives.length)
      : 0;

    // Determine trend from indicators
    const allIndicators = catObjectives.flatMap((oa) => oa.objective.indicators);
    const improving = allIndicators.filter((i) => i.trend === "improving").length;
    const declining = allIndicators.filter((i) => i.trend === "declining").length;
    let trend: "improving" | "stable" | "declining";
    if (improving > declining + 1) trend = "improving";
    else if (declining > improving + 1) trend = "declining";
    else trend = "stable";

    return {
      category: cat,
      label: CATEGORY_LABELS[cat] ?? cat,
      score: avgProgress,
      objectiveCount: catObjectives.length,
      trend,
    };
  });

  // Overall progress
  const overallProgress = objectiveAnalyses.length > 0
    ? Math.round(objectiveAnalyses.reduce((sum, o) => sum + o.progressPercent, 0) / objectiveAnalyses.length)
    : 0;

  let progressGrade: OutcomeAnalysis["progressGrade"];
  if (objectives.length === 0) progressGrade = "insufficient_data";
  else if (overallProgress >= 80) progressGrade = "excellent";
  else if (overallProgress >= 60) progressGrade = "good";
  else if (overallProgress >= 40) progressGrade = "mixed";
  else progressGrade = "concerning";

  // Recommendations
  const offTrack = objectiveAnalyses.filter((o) => !o.onTrack);
  if (offTrack.length > 0) {
    recommendations.push(`${offTrack.length} objective${offTrack.length > 1 ? "s need" : " needs"} review — consider adjusting targets or approach`);
  }
  const noEvidence = objectiveAnalyses.filter((o) => o.evidenceCount === 0);
  if (noEvidence.length > 0) {
    recommendations.push(`${noEvidence.length} objective${noEvidence.length > 1 ? "s have" : " has"} no evidence — staff should record progress against these`);
  }
  if (celebrations.length > 0) {
    recommendations.push("Celebrate achieved outcomes with the young person — recognition reinforces progress");
  }

  // Recent evidence (last 7 days)
  const recentEvidence = evidence
    .filter((e) => dateDiff(e.date, today) <= 7)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  return {
    childId,
    childName,
    analysedAt: today,
    totalObjectives: objectives.length,
    overallProgress,
    progressGrade,
    objectives: objectiveAnalyses,
    categoryScores: categoryScores.sort((a, b) => b.score - a.score),
    recentEvidence,
    alerts: alerts.sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity)),
    celebrations: celebrations.slice(0, 3),
    recommendations: recommendations.slice(0, 4),
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function dateDiff(dateA: string, dateB: string): number {
  return Math.round((new Date(dateB).getTime() - new Date(dateA).getTime()) / 86400000);
}

function severityOrder(s: "high" | "medium" | "low"): number {
  switch (s) {
    case "high": return 0;
    case "medium": return 1;
    case "low": return 2;
  }
}
