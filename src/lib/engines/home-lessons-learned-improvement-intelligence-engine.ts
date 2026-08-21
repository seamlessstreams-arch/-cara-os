// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME LESSONS LEARNED & IMPROVEMENT INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Analyses lessons learned from incidents, complaints, audits, and reflective
// practice alongside improvement objectives and quality audit outcomes to
// surface how effectively the home embeds learning and drives improvement.
//
// Regulatory: CHR 2015 Reg 40 (notification of significant events), Reg 45
// (review of quality of care). SCCIF: "The home demonstrates continuous
// improvement and learns from experience."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface LessonInput {
  id: string;
  source: string; // "incident"|"complaint"|"audit"|"reflective_practice"|"reg_44"|"external_feedback"|"critical_incident_review"
  theme_area: string; // "safeguarding"|"practice"|"communication"|"recording"|"training"|"environment"|"wellbeing"|"multi_agency"
  status: string; // "identified"|"in_progress"|"embedded"|"monitoring"
  embedding_score: number | null; // 0-100
  staff_briefed: boolean;
  policies_updated_count: number;
  training_delivered_count: number;
  evidence_of_embedding_count: number;
}

export interface ImprovementObjectiveInput {
  id: string;
  source: string; // "reg44"|"ofsted"|"reg45"|"self"|"maintenance"|"regulatory"
  priority: string; // "high"|"medium"|"low"
  status: string; // "planned"|"in_progress"|"completed"|"overdue"
  progress: number; // 0-100
}

export interface QualityAuditInput {
  id: string;
  audit_score: number | null; // 0-100
  actions_identified: number;
  actions_completed: number;
}

export interface LessonsLearnedInput {
  today: string;
  total_staff: number;
  lessons: LessonInput[];
  objectives: ImprovementObjectiveInput[];
  audits: QualityAuditInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type LessonsLearnedRating = "outstanding" | "good" | "adequate" | "inadequate" | "insufficient_data";

export interface LessonsLearnedResult {
  lessons_rating: LessonsLearnedRating;
  lessons_score: number | null;
  headline: string;
  total_lessons: number;
  embedded_rate: number | null;
  staff_briefing_rate: number | null;
  objective_completion_rate: number | null;
  overdue_objectives: number;
  average_audit_score: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: "immediate" | "soon" | "planned"; regulatory_ref: string }[];
  insights: { text: string; severity: "critical" | "warning" | "positive" }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeLessonsLearnedImprovement(
  input: LessonsLearnedInput,
): LessonsLearnedResult {
  const { total_staff, lessons, objectives, audits } = input;

  // ── Insufficient data guard ───────────────────────────────────────────
  if (total_staff === 0) {
    return {
      lessons_rating: "insufficient_data",
      lessons_score: 0,
      headline: "No staff recorded — lessons learned analysis cannot be performed.",
      total_lessons: lessons.length,
      embedded_rate: 0,
      staff_briefing_rate: 0,
      objective_completion_rate: 0,
      overdue_objectives: 0,
      average_audit_score: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ───────────────────────────────────────────────────────────
  const totalLessons = lessons.length;

  const embeddedOrMonitoring = lessons.filter(
    (l) => l.status === "embedded" || l.status === "monitoring",
  ).length;
  const embeddedRate = pct(embeddedOrMonitoring, totalLessons);

  const briefedCount = lessons.filter((l) => l.staff_briefed).length;
  const staffBriefingRate = pct(briefedCount, totalLessons);

  const completedObjectives = objectives.filter((o) => o.status === "completed").length;
  const objectiveCompletionRate = pct(completedObjectives, objectives.length);

  const overdueObjectives = objectives.filter((o) => o.status === "overdue").length;

  const averageAuditScore =
    audits.length > 0
      ? Math.round(audits.reduce((sum, a) => sum + (a.audit_score ?? 0), 0) / audits.length)
      : null;

  // ── Scoring ───────────────────────────────────────────────────────────
  // Base 52 + 6 modifiers (max ~+30 → outstanding reachable at ~82)
  let score = 52;

  // mod1: Lesson embedding rate (embedded+monitoring / total lessons) (±5)
  if (totalLessons === 0) {
    score -= 1;
  } else if (embeddedRate >= 80) {
    score += 5;
  } else if (embeddedRate >= 60) {
    score += 2;
  } else if (embeddedRate >= 30) {
    score += 0;
  } else {
    score -= 5;
  }

  // mod2: Staff briefing rate (staff_briefed / total lessons) (+6/-5)
  if (totalLessons === 0) {
    score += 0;
  } else if (staffBriefingRate >= 90) {
    score += 6;
  } else if (staffBriefingRate >= 70) {
    score += 3;
  } else if (staffBriefingRate >= 40) {
    score += 0;
  } else {
    score -= 5;
  }

  // mod3: Objective completion rate (completed / total objectives) (+5/-4)
  if (objectives.length === 0) {
    score += 1;
  } else if (objectiveCompletionRate >= 80) {
    score += 5;
  } else if (objectiveCompletionRate >= 60) {
    score += 2;
  } else if (objectiveCompletionRate >= 30) {
    score += 0;
  } else {
    score -= 4;
  }

  // mod4: Overdue control (overdue / total objectives) (+5/-5)
  if (objectives.length === 0) {
    score += 2;
  } else {
    const overdueRate = pct(overdueObjectives, objectives.length);
    if (overdueRate === 0) {
      score += 5;
    } else if (overdueRate < 10) {
      score += 2;
    } else if (overdueRate < 25) {
      score += 0;
    } else {
      score -= 5;
    }
  }

  // mod5: Audit action completion (actions_completed / actions_identified across all audits) (+4/-4)
  const totalActionsIdentified = audits.reduce((sum, a) => sum + a.actions_identified, 0);
  const totalActionsCompleted = audits.reduce((sum, a) => sum + a.actions_completed, 0);
  if (audits.length === 0) {
    score += 0;
  } else {
    const auditActionRate = pct(totalActionsCompleted, totalActionsIdentified);
    if (auditActionRate >= 90) {
      score += 4;
    } else if (auditActionRate >= 70) {
      score += 1;
    } else if (auditActionRate >= 40) {
      score += 0;
    } else {
      score -= 4;
    }
  }

  // mod6: Learning diversity (unique theme_areas / 8) (+5/-5)
  if (totalLessons === 0) {
    score -= 2;
  } else {
    const uniqueThemes = new Set(lessons.map((l) => l.theme_area)).size;
    if (uniqueThemes >= 6) {
      score += 5;
    } else if (uniqueThemes >= 4) {
      score += 2;
    } else if (uniqueThemes >= 2) {
      score += 0;
    } else {
      score -= 5;
    }
  }

  // Clamp 0-100
  score = Math.max(0, Math.min(100, score));

  // ── Rating ────────────────────────────────────────────────────────────
  let lessons_rating: LessonsLearnedRating;
  if (score >= 80) lessons_rating = "outstanding";
  else if (score >= 65) lessons_rating = "good";
  else if (score >= 45) lessons_rating = "adequate";
  else lessons_rating = "inadequate";

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (embeddedRate >= 80 && totalLessons > 0) {
    strengths.push(`${embeddedRate}% of lessons are embedded or in monitoring — strong evidence of learning being translated into practice.`);
  }
  if (staffBriefingRate >= 90 && totalLessons > 0) {
    strengths.push(`${staffBriefingRate}% staff briefing rate — lessons are being systematically communicated to the team.`);
  }
  if (overdueObjectives === 0 && objectives.length > 0) {
    strengths.push("No overdue improvement objectives — the home is meeting its improvement timescales.");
  }
  if (objectiveCompletionRate >= 80 && objectives.length > 0) {
    strengths.push(`${objectiveCompletionRate}% objective completion rate — improvement goals are being achieved.`);
  }
  if ((averageAuditScore ?? 0) >= 80 && audits.length > 0) {
    strengths.push(`Average audit score of ${averageAuditScore}% — quality assurance outcomes are consistently strong.`);
  }
  if (totalLessons > 0) {
    const uniqueThemes = new Set(lessons.map((l) => l.theme_area)).size;
    if (uniqueThemes >= 6) {
      strengths.push(`Learning spans ${uniqueThemes} theme areas — the home captures lessons from a wide range of sources.`);
    }
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  const highPriorityOverdue = objectives.filter(
    (o) => o.status === "overdue" && o.priority === "high",
  );
  if (highPriorityOverdue.length > 0) {
    concerns.push(`${highPriorityOverdue.length} high-priority improvement objective${highPriorityOverdue.length > 1 ? "s" : ""} overdue — these require immediate management attention.`);
  }
  if (embeddedRate < 40 && totalLessons > 0) {
    concerns.push(`Only ${embeddedRate}% of lessons are embedded — learning is being identified but not translating into sustained practice change.`);
  }
  if (staffBriefingRate < 50 && totalLessons > 0) {
    concerns.push(`Staff briefing rate is only ${staffBriefingRate}% — lessons are not being consistently shared with the team.`);
  }
  if ((averageAuditScore ?? 0) < 50 && audits.length > 0) {
    concerns.push(`Average audit score of ${averageAuditScore}% — quality assurance outcomes indicate significant areas for improvement.`);
  }
  if (totalLessons === 0 && total_staff > 0) {
    concerns.push("No lessons identified despite having active staff — the home may not have a structured learning culture.");
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: { rank: number; recommendation: string; urgency: "immediate" | "soon" | "planned"; regulatory_ref: string }[] = [];
  let rank = 0;

  if (highPriorityOverdue.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Escalate overdue high-priority objectives — assign clear owners, set recovery timescales, and report to the responsible individual.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 40",
    });
  }
  if (embeddedRate < 40 && totalLessons > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Strengthen lesson embedding — ensure each lesson has an action plan, named lead, and review date to move from identification to sustained practice change.",
      urgency: "soon",
      regulatory_ref: "SCCIF Quality",
    });
  }
  if (staffBriefingRate < 50 && totalLessons > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Improve staff briefing processes — use team meetings, handover notes, and supervision to ensure all staff are briefed on lessons learned.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 40",
    });
  }
  if (overdueObjectives > 0 && highPriorityOverdue.length === 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Review overdue objectives and reset timescales — ensure improvement plans remain achievable and resourced.",
      urgency: "soon",
      regulatory_ref: "SCCIF Quality",
    });
  }
  if (totalLessons === 0 && total_staff > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Establish a structured lessons learned framework — capture learning from incidents, complaints, audits, and reflective practice systematically.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 40",
    });
  }
  if ((averageAuditScore ?? 0) < 50 && audits.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Address low audit scores with targeted improvement plans — review findings, assign actions, and schedule follow-up audits.",
      urgency: "soon",
      regulatory_ref: "SCCIF Quality",
    });
  }
  if (totalLessons > 0) {
    const uniqueThemes = new Set(lessons.map((l) => l.theme_area)).size;
    if (uniqueThemes < 2) {
      recommendations.push({
        rank: ++rank,
        recommendation: "Broaden learning capture across theme areas — ensure lessons are identified from safeguarding, practice, communication, and other domains.",
        urgency: "planned",
        regulatory_ref: "SCCIF Quality",
      });
    }
  }

  // Cap at 5
  recommendations.splice(5);

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: { text: string; severity: "critical" | "warning" | "positive" }[] = [];

  // Positive: high embedding + diverse themes
  if (totalLessons > 0) {
    const uniqueThemes = new Set(lessons.map((l) => l.theme_area)).size;
    if (embeddedRate >= 80 && uniqueThemes >= 6) {
      insights.push({
        text: "Strong learning culture — high embedding rate across diverse theme areas demonstrates that the home systematically learns from experience and translates this into improved practice.",
        severity: "positive",
      });
    }
  }

  // Critical: many overdue objectives
  if (overdueObjectives >= 3) {
    insights.push({
      text: `${overdueObjectives} improvement objectives are overdue — the home's improvement plan is stalling and Ofsted will expect to see evidence of timely progress against identified areas for development.`,
      severity: "critical",
    });
  }

  // Warning: low diversity
  if (totalLessons > 0) {
    const uniqueThemes = new Set(lessons.map((l) => l.theme_area)).size;
    if (uniqueThemes < 2) {
      insights.push({
        text: `Learning is concentrated in only ${uniqueThemes} theme area${uniqueThemes === 1 ? "" : "s"} — a narrow learning focus may indicate blind spots in the home's self-evaluation and improvement cycle.`,
        severity: "warning",
      });
    }
  }

  // Cap at 3
  insights.splice(3);

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (lessons_rating === "outstanding") {
    headline = `Outstanding lessons learned and improvement culture — ${embeddedRate}% embedding rate across ${totalLessons} lessons with ${objectiveCompletionRate}% objective completion.`;
  } else if (lessons_rating === "good") {
    headline = `Good learning and improvement practice — ${totalLessons} lessons captured with ${embeddedRate}% embedding. ${concerns.length > 0 ? concerns.length + " area" + (concerns.length > 1 ? "s" : "") + " to strengthen." : ""}`;
  } else if (lessons_rating === "adequate") {
    headline = `Lessons learned and improvement requires strengthening — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified across learning and improvement practices.`;
  } else {
    headline = "Lessons learned and improvement is inadequate — significant gaps in learning capture, embedding, or improvement delivery.";
  }

  return {
    lessons_rating,
    lessons_score: score,
    headline,
    total_lessons: totalLessons,
    embedded_rate: embeddedRate,
    staff_briefing_rate: staffBriefingRate,
    objective_completion_rate: objectiveCompletionRate,
    overdue_objectives: overdueObjectives,
    average_audit_score: averageAuditScore,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
