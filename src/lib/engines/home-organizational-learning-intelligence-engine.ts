// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME ORGANIZATIONAL LEARNING INTELLIGENCE ENGINE
// Home-level: aggregates serious incident reviews, critical incident debriefs,
// service improvements, lessons learned, and practice change culture.
// CHR 2015 Reg 45: "Review of quality of care."
// SCCIF: "The home demonstrates continuous improvement."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input types ─────────────────────────────────────────────────────────────

export interface SeriousIncidentReviewInput {
  id: string;
  review_type: string;              // serious_incident | near_miss | safeguarding_practice | complaint_learning | external_review | thematic
  incident_date: string;
  review_commenced_date: string;
  review_completed_date: string | null;
  status: string;                   // initiated | under_review | draft_report | final_report | actions_in_progress | closed | monitoring
  lessons_learned_count: number;
  actions_total: number;
  actions_completed: number;
  actions_overdue: number;
  practice_changes_count: number;
  training_implications_count: number;
  policy_changes_count: number;
}

export interface CriticalIncidentDebriefInput {
  id: string;
  incident_date: string;
  debrief_date: string;
  impact_level: string;             // high | medium | low
  status: string;                   // completed | scheduled | overdue | cancelled
  what_worked_well_count: number;
  what_could_improve_count: number;
  root_causes_count: number;
  actions_agreed_count: number;
  actions_completed: number;
  training_needs_count: number;
}

export interface ServiceImprovementInput {
  id: string;
  category: string;
  source: string;                   // reg_44_feedback | reg_45_review | childrens_voice | staff_suggestion | audit_finding | ofsted | sector_guidance
  start_date: string;
  target_completion_date: string;
  status: string;                   // proposed | approved | in_progress | implemented | embedded | on_hold | closed
  risk_rag_rating: string;          // red | amber | green
  milestones_total: number;
  milestones_achieved: number;
  last_review_date: string;
  next_review_date: string;
}

export interface HomeOrganizationalLearningInput {
  today: string;
  serious_incident_reviews: SeriousIncidentReviewInput[];
  critical_debriefs: CriticalIncidentDebriefInput[];
  service_improvements: ServiceImprovementInput[];
}

// ── Output types ────────────────────────────────────────────────────────────

export type OrgLearningRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface SIRProfile {
  total_reviews: number;
  completed_reviews: number;
  open_reviews: number;
  total_lessons_learned: number;
  total_actions: number;
  actions_completed: number;
  actions_overdue: number;
  action_completion_rate: number;
  practice_changes_total: number;
}

export interface DebriefProfile {
  total_debriefs_90d: number;
  completed_rate: number;
  high_impact_count: number;
  avg_root_causes: number;
  total_training_needs: number;
  action_completion_rate: number;
}

export interface ImprovementProfile {
  total_improvements: number;
  active_improvements: number;
  implemented_count: number;
  embedded_count: number;
  overdue_count: number;
  red_rag_count: number;
  milestone_achievement_rate: number;
  by_source: Record<string, number>;
}

export interface HomeOrganizationalLearningResult {
  org_learning_rating: OrgLearningRating;
  org_learning_score: number;
  headline: string;
  sir: SIRProfile;
  debriefs: DebriefProfile;
  improvements: ImprovementProfile;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHomeOrganizationalLearning(
  input: HomeOrganizationalLearningInput,
): HomeOrganizationalLearningResult {
  const { today, serious_incident_reviews, critical_debriefs, service_improvements } = input;

  // ── Insufficient data guard ───────────────────────────────────────────
  if (serious_incident_reviews.length === 0 && critical_debriefs.length === 0 && service_improvements.length === 0) {
    return {
      org_learning_rating: "insufficient_data",
      org_learning_score: 0,
      headline: "No organizational learning data available for analysis.",
      sir: { total_reviews: 0, completed_reviews: 0, open_reviews: 0, total_lessons_learned: 0, total_actions: 0, actions_completed: 0, actions_overdue: 0, action_completion_rate: 0, practice_changes_total: 0 },
      debriefs: { total_debriefs_90d: 0, completed_rate: 0, high_impact_count: 0, avg_root_causes: 0, total_training_needs: 0, action_completion_rate: 0 },
      improvements: { total_improvements: 0, active_improvements: 0, implemented_count: 0, embedded_count: 0, overdue_count: 0, red_rag_count: 0, milestone_achievement_rate: 0, by_source: {} },
      strengths: [],
      concerns: ["No organizational learning records — continuous improvement culture cannot be assessed."],
      recommendations: [],
      insights: [],
    };
  }

  // ── Serious Incident Reviews ──────────────────────────────────────────
  const completedStatuses = ["final_report", "closed", "monitoring"];
  const openStatuses = ["initiated", "under_review", "draft_report", "actions_in_progress"];
  const completedReviews = serious_incident_reviews.filter(r => completedStatuses.includes(r.status)).length;
  const openReviews = serious_incident_reviews.filter(r => openStatuses.includes(r.status)).length;
  const totalLessons = serious_incident_reviews.reduce((sum, r) => sum + r.lessons_learned_count, 0);
  const totalSIRActions = serious_incident_reviews.reduce((sum, r) => sum + r.actions_total, 0);
  const completedSIRActions = serious_incident_reviews.reduce((sum, r) => sum + r.actions_completed, 0);
  const overdueSIRActions = serious_incident_reviews.reduce((sum, r) => sum + r.actions_overdue, 0);
  const sirActionCompletionRate = pct(completedSIRActions, totalSIRActions);
  const practiceChangesTotal = serious_incident_reviews.reduce((sum, r) => sum + r.practice_changes_count, 0);

  const sirProfile: SIRProfile = {
    total_reviews: serious_incident_reviews.length,
    completed_reviews: completedReviews,
    open_reviews: openReviews,
    total_lessons_learned: totalLessons,
    total_actions: totalSIRActions,
    actions_completed: completedSIRActions,
    actions_overdue: overdueSIRActions,
    action_completion_rate: sirActionCompletionRate,
    practice_changes_total: practiceChangesTotal,
  };

  // ── Critical Debriefs (90-day window) ─────────────────────────────────
  const debriefs90d = critical_debriefs.filter(d => {
    const diff = daysBetween(d.debrief_date, today);
    return diff >= 0 && diff <= 90;
  });

  const completedDebriefs = debriefs90d.filter(d => d.status === "completed").length;
  const debriefCompletedRate = pct(completedDebriefs, debriefs90d.length);
  const highImpactDebriefs = debriefs90d.filter(d => d.impact_level === "high").length;
  const avgRootCauses = debriefs90d.length > 0
    ? Math.round((debriefs90d.reduce((sum, d) => sum + d.root_causes_count, 0) / debriefs90d.length) * 10) / 10
    : 0;
  const totalTrainingNeeds = debriefs90d.reduce((sum, d) => sum + d.training_needs_count, 0);
  const totalDebriefActions = debriefs90d.reduce((sum, d) => sum + d.actions_agreed_count, 0);
  const completedDebriefActions = debriefs90d.reduce((sum, d) => sum + d.actions_completed, 0);
  const debriefActionRate = pct(completedDebriefActions, totalDebriefActions);

  const debriefProfile: DebriefProfile = {
    total_debriefs_90d: debriefs90d.length,
    completed_rate: debriefCompletedRate,
    high_impact_count: highImpactDebriefs,
    avg_root_causes: avgRootCauses,
    total_training_needs: totalTrainingNeeds,
    action_completion_rate: debriefActionRate,
  };

  // ── Service Improvements ──────────────────────────────────────────────
  const activeStatuses = ["approved", "in_progress"];
  const activeImprovements = service_improvements.filter(s => activeStatuses.includes(s.status)).length;
  const implementedCount = service_improvements.filter(s => s.status === "implemented").length;
  const embeddedCount = service_improvements.filter(s => s.status === "embedded").length;
  const overdueImprovements = service_improvements.filter(s =>
    activeStatuses.includes(s.status) && daysBetween(s.target_completion_date, today) > 0,
  ).length;
  const redRag = service_improvements.filter(s =>
    s.risk_rag_rating === "red" && activeStatuses.includes(s.status),
  ).length;
  const totalMilestones = service_improvements.reduce((sum, s) => sum + s.milestones_total, 0);
  const achievedMilestones = service_improvements.reduce((sum, s) => sum + s.milestones_achieved, 0);
  const milestoneRate = pct(achievedMilestones, totalMilestones);

  const bySource: Record<string, number> = {};
  for (const s of service_improvements) {
    bySource[s.source] = (bySource[s.source] ?? 0) + 1;
  }

  const improvementProfile: ImprovementProfile = {
    total_improvements: service_improvements.length,
    active_improvements: activeImprovements,
    implemented_count: implementedCount,
    embedded_count: embeddedCount,
    overdue_count: overdueImprovements,
    red_rag_count: redRag,
    milestone_achievement_rate: milestoneRate,
    by_source: bySource,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  // Base 52 + max bonuses 28 = 80 (outstanding threshold)
  let score = 52;

  // mod1: SIR action completion (±5) — lessons are implemented
  if (totalSIRActions === 0) {
    score += (serious_incident_reviews.length > 0 ? 2 : 0); // Reviews exist but no actions = slight positive
  } else {
    if (sirActionCompletionRate >= 90 && overdueSIRActions === 0) score += 5;
    else if (sirActionCompletionRate >= 70) score += 3;
    else if (sirActionCompletionRate >= 50) score += 0;
    else score -= 5;
  }

  // mod2: Debrief completion rate (±4) — learning from incidents
  if (debriefs90d.length === 0) {
    score += 1; // No debriefs needed = neutral-positive
  } else {
    if (debriefCompletedRate >= 90) score += 4;
    else if (debriefCompletedRate >= 75) score += 2;
    else if (debriefCompletedRate >= 50) score += 0;
    else score -= 4;
  }

  // mod3: Practice changes from reviews (±4) — evidence of learning embedding
  const totalPracticeChanges = practiceChangesTotal +
    service_improvements.filter(s => s.status === "implemented" || s.status === "embedded").length;
  if (totalPracticeChanges >= 5) score += 4;
  else if (totalPracticeChanges >= 3) score += 2;
  else if (totalPracticeChanges >= 1) score += 0;
  else score -= 4;

  // mod4: Overdue SIR actions (±3) — governance currency
  if (overdueSIRActions === 0) score += 3;
  else if (overdueSIRActions <= 2) score += 0;
  else score -= 3;

  // mod5: Service improvement progress (±4) — active improvement culture
  if (service_improvements.length === 0) {
    score -= 2;
  } else {
    const progressRate = pct(implementedCount + embeddedCount, service_improvements.length);
    if (progressRate >= 60 && redRag === 0) score += 4;
    else if (progressRate >= 40) score += 2;
    else if (progressRate >= 20) score += 0;
    else score -= 4;
  }

  // mod6: Lessons learned volume (±3) — depth of reflection
  if (totalLessons >= 10) score += 3;
  else if (totalLessons >= 5) score += 1;
  else if (totalLessons >= 1) score += 0;
  else score -= 3;

  // mod7: Multi-source improvements (±3) — diverse input for change
  const sourceCount = Object.keys(bySource).length;
  if (sourceCount >= 4) score += 3;
  else if (sourceCount >= 2) score += 1;
  else if (sourceCount >= 1) score += 0;
  else score -= 3;

  // mod8: Root cause analysis depth (±2) — quality of learning
  if (debriefs90d.length === 0) {
    score += 0;
  } else {
    if (avgRootCauses >= 2) score += 2;
    else if (avgRootCauses >= 1) score += 1;
    else score -= 2;
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  // ── Rating ────────────────────────────────────────────────────────────
  let org_learning_rating: OrgLearningRating;
  if (score >= 80) org_learning_rating = "outstanding";
  else if (score >= 65) org_learning_rating = "good";
  else if (score >= 45) org_learning_rating = "adequate";
  else org_learning_rating = "inadequate";

  // ── Strengths / Concerns / Recommendations / Insights ─────────────────
  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  const insights: { text: string; severity: string }[] = [];
  let rank = 0;

  // Strengths
  if (sirActionCompletionRate >= 90 && totalSIRActions > 0) strengths.push(`${sirActionCompletionRate}% of serious incident review actions completed — learning is being translated into practice.`);
  if (debriefCompletedRate >= 90 && debriefs90d.length > 0) strengths.push(`${debriefCompletedRate}% debrief completion rate — strong post-incident reflection culture.`);
  if (totalLessons >= 10) strengths.push(`${totalLessons} lessons learned documented — rich organisational knowledge being captured.`);
  if (implementedCount + embeddedCount >= 3) strengths.push(`${implementedCount + embeddedCount} service improvements implemented/embedded — continuous improvement culture is thriving.`);
  if (practiceChangesTotal >= 3) strengths.push(`${practiceChangesTotal} practice changes arising from reviews — evidence of a learning organisation.`);
  if (sourceCount >= 4) strengths.push(`Improvements sourced from ${sourceCount} different channels — diverse input drives change.`);

  // Concerns
  if (overdueSIRActions > 0) concerns.push(`${overdueSIRActions} overdue action${overdueSIRActions > 1 ? "s" : ""} from serious incident reviews — learning risks being lost.`);
  if (openReviews >= 3) concerns.push(`${openReviews} open serious incident reviews — backlog may delay learning and practice change.`);
  if (debriefs90d.length > 0 && debriefCompletedRate < 50) concerns.push(`Only ${debriefCompletedRate}% of debriefs completed — staff may not be processing critical incidents.`);
  if (overdueImprovements > 0) concerns.push(`${overdueImprovements} service improvement${overdueImprovements > 1 ? "s" : ""} overdue — momentum for change is stalling.`);
  if (redRag > 0) concerns.push(`${redRag} service improvement${redRag > 1 ? "s" : ""} at RED RAG rating — high-risk initiatives need escalation.`);
  if (service_improvements.length === 0) concerns.push("No service improvement initiatives recorded — continuous improvement may not be formalised.");

  // Recommendations
  if (overdueSIRActions > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Complete overdue SIR actions — assign owners and set realistic deadlines for each outstanding item.", urgency: overdueSIRActions > 3 ? "immediate" : "soon", regulatory_ref: "Reg 45" });
  }
  if (service_improvements.length === 0) {
    recommendations.push({ rank: ++rank, recommendation: "Establish a service improvement board — formally track improvements from Reg 44/45, audits, children's voice, and staff suggestions.", urgency: "soon", regulatory_ref: "Reg 45" });
  }
  if (debriefs90d.length > 0 && debriefCompletedRate < 75) {
    recommendations.push({ rank: ++rank, recommendation: "Prioritise debrief completion — schedule within 72 hours of critical incidents and protect time for reflection.", urgency: "soon", regulatory_ref: "Reg 34" });
  }
  if (totalLessons < 3 && serious_incident_reviews.length > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Deepen lessons-learned capture — each review should produce at least 3 documented lessons with action plans.", urgency: "planned", regulatory_ref: "Reg 45" });
  }
  if (overdueImprovements > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Review and reset overdue improvement targets — ensure they remain achievable and resourced.", urgency: "soon", regulatory_ref: "Reg 45" });
  }

  // ARIA Insights
  if (sirActionCompletionRate >= 90 && debriefCompletedRate >= 90 && implementedCount + embeddedCount >= 3 && totalLessons >= 5) {
    insights.push({ text: "Organisational learning is exemplary. Serious incidents drive real practice change, debriefs embed reflection, and service improvements are systematically tracked. Ofsted will recognise this as a hallmark of outstanding leadership.", severity: "positive" });
  }
  if (overdueSIRActions >= 5) {
    insights.push({ text: `${overdueSIRActions} overdue SIR actions indicates systemic governance failure. Lessons from serious incidents are not being implemented — this represents a significant risk to children and will concern Ofsted.`, severity: "critical" });
  }
  if (openReviews >= 3 && overdueSIRActions >= 3) {
    insights.push({ text: `${openReviews} open reviews with ${overdueSIRActions} overdue actions. The learning pipeline is blocked — consider dedicated time for review completion and action ownership.`, severity: "warning" });
  }
  if (highImpactDebriefs >= 3) {
    insights.push({ text: `${highImpactDebriefs} high-impact debriefs in 90 days. Consider whether the home's therapeutic model is adequately preventing critical incidents or whether environmental factors need review.`, severity: "warning" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (org_learning_rating === "outstanding") {
    headline = `Outstanding organisational learning — ${totalLessons} lessons captured, ${implementedCount + embeddedCount} improvements delivered.`;
  } else if (org_learning_rating === "good") {
    headline = `Good learning culture — ${sirActionCompletionRate}% SIR actions completed. ${concerns.length > 0 ? concerns.length + " area" + (concerns.length > 1 ? "s" : "") + " for improvement." : ""}`;
  } else if (org_learning_rating === "adequate") {
    headline = `Organisational learning requires improvement — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified.`;
  } else {
    headline = `Organisational learning is inadequate — significant gaps in review completion, action follow-through, or improvement culture.`;
  }

  return {
    org_learning_rating,
    org_learning_score: score,
    headline,
    sir: sirProfile,
    debriefs: debriefProfile,
    improvements: improvementProfile,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
