// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME TASK ACTION COMPLETION INTELLIGENCE ENGINE
// Home-level: measures task management quality — completion rates, overdue
// tracking, priority management, incident-linked follow-through, timeliness,
// and governance around action tracking.
// CHR 2015 Reg 13 (Leadership and Management), Reg 40 (Notification of Events).
// SCCIF: "Well-led and managed", "Safety of children."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface TaskInput {
  id: string;
  title: string;
  category: string;
  priority: string; // "urgent" | "high" | "medium" | "low"
  status: string; // "not_started" | "in_progress" | "completed" | "blocked"
  assigned_to: string;
  due_date: string; // ISO date
  completed_at: string; // ISO date or ""
  created_at: string; // ISO date
  requires_sign_off: boolean;
  signed_off_by: string;
  linked_child_id: string;
  linked_incident_id: string;
  recurring: boolean;
  escalated: boolean;
}

export interface IncidentTaskInput {
  id: string;
  date: string; // ISO date
  severity: string;
  status: string;
  has_linked_task: boolean;
}

export interface TaskActionCompletionInput {
  today: string;
  total_staff: number;
  tasks: TaskInput[];
  incidents: IncidentTaskInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type TaskActionRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface TaskActionInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface TaskActionRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface TaskActionCompletionResult {
  task_rating: TaskActionRating;
  task_score: number;
  headline: string;
  total_tasks: number;
  completion_rate: number;
  overdue_count: number;
  on_time_rate: number;
  incident_follow_through: number;
  urgent_completion_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: TaskActionRecommendation[];
  insights: TaskActionInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function daysBetween(a: string, b: string): number {
  const diff = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

function toRating(score: number): TaskActionRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeTaskActionCompletion(
  input: TaskActionCompletionInput,
): TaskActionCompletionResult {
  const { today, total_staff, tasks: allTasks, incidents: allIncidents } = input;

  // Special case: no staff → insufficient data
  if (total_staff === 0) {
    return {
      task_rating: "insufficient_data",
      task_score: 0,
      headline: "No staff recorded — task action completion data not available.",
      total_tasks: allTasks.length,
      completion_rate: 0,
      overdue_count: 0,
      on_time_rate: 0,
      incident_follow_through: 0,
      urgent_completion_rate: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [{ text: "No staff currently recorded for this home. Task action completion metrics require active staff to assess.", severity: "warning" }],
    };
  }

  // Filter to last 90 days
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const tasks = allTasks.filter(t => t.created_at >= cutoffStr && t.created_at <= today);
  const incidents = allIncidents.filter(i => i.date >= cutoffStr && i.date <= today);

  // Special case: 0 tasks AND 0 incidents with staff present → good baseline
  if (tasks.length === 0 && incidents.length === 0) {
    return {
      task_rating: "good",
      task_score: 72,
      headline: "No tasks or incidents recorded in the last 90 days — no overdue actions, acceptable baseline.",
      total_tasks: allTasks.length,
      completion_rate: 0,
      overdue_count: 0,
      on_time_rate: 0,
      incident_follow_through: 0,
      urgent_completion_rate: 0,
      strengths: ["No overdue tasks or outstanding incidents — the home has a clean action slate."],
      concerns: [],
      recommendations: [],
      insights: [{ text: "No tasks or incidents have been recorded in the last 90 days. While this means there are no overdue actions, consider whether task tracking is being actively used to manage home operations. A well-run home typically generates routine tasks around maintenance, reviews, and follow-ups.", severity: "positive" }],
    };
  }

  // ── Compute Metrics ───────────────────────────────────────────────────

  const completedTasks = tasks.filter(t => t.status === "completed");
  const completionRate = pct(completedTasks.length, tasks.length);

  // Overdue: status !== "completed" AND due_date < today AND due_date !== ""
  const overdueTasks = tasks.filter(
    t => t.status !== "completed" && t.due_date !== "" && t.due_date < today,
  );
  const overdueCount = overdueTasks.length;

  // On-time rate: completed tasks where completed_at <= due_date, as pct of completed tasks with a due_date
  const completedWithDue = completedTasks.filter(t => t.due_date !== "");
  const onTimeTasks = completedWithDue.filter(t => t.completed_at <= t.due_date);
  const onTimeRate = pct(onTimeTasks.length, completedWithDue.length);

  // Incident follow-through: pct of incidents with has_linked_task === true
  const incidentsWithTask = incidents.filter(i => i.has_linked_task);
  const incidentFollowThrough = pct(incidentsWithTask.length, incidents.length);

  // Urgent completion rate: completed urgent tasks as pct of all urgent tasks
  const urgentTasks = tasks.filter(t => t.priority === "urgent");
  const completedUrgent = urgentTasks.filter(t => t.status === "completed");
  const urgentCompletionRate = pct(completedUrgent.length, urgentTasks.length);

  // Sign-off compliance: tasks that require sign-off and have been signed off
  const requiresSignOff = tasks.filter(t => t.requires_sign_off);
  const signedOff = requiresSignOff.filter(t => t.signed_off_by !== "");
  const signOffRate = pct(signedOff.length, requiresSignOff.length);

  // Escalated tasks
  const escalatedTasks = tasks.filter(t => t.escalated);
  const escalationRate = pct(escalatedTasks.length, tasks.length);

  // ── Scoring: Base 52 + 6 modifiers ────────────────────────────────────

  let score = 52;

  // 1. Completion rate
  if (completionRate >= 95) score += 6;
  else if (completionRate >= 80) score += 3;
  else if (completionRate < 50) score -= 8;
  else if (completionRate < 65) score -= 5;

  // 2. Overdue management (overdue as pct of total tasks)
  const overdueRate = pct(overdueCount, tasks.length);
  if (tasks.length === 0) {
    score += 0; // no tasks means no overdue — neutral
  } else if (overdueRate === 0) score += 5;
  else if (overdueRate <= 5) score += 2;
  else if (overdueRate > 20) score -= 5;

  // 3. On-time rate
  if (completedWithDue.length === 0) {
    score -= 1; // no due-dated completed tasks — slight concern
  } else {
    if (onTimeRate >= 95) score += 5;
    else if (onTimeRate >= 80) score += 2;
    else if (onTimeRate < 60) score -= 4;
  }

  // 4. Incident follow-through
  if (incidents.length === 0) {
    score += 0; // no incidents — neutral
  } else {
    if (incidentFollowThrough >= 95) score += 5;
    else if (incidentFollowThrough >= 80) score += 2;
    else if (incidentFollowThrough < 60) score -= 4;
  }

  // 5. Urgent task completion
  if (urgentTasks.length === 0) {
    score += 0; // no urgent tasks — neutral
  } else {
    if (urgentCompletionRate >= 95) score += 4;
    else if (urgentCompletionRate >= 80) score += 2;
    else if (urgentCompletionRate < 60) score -= 4;
  }

  // 6. Sign-off compliance & governance
  if (requiresSignOff.length === 0) {
    score += 0; // no sign-off tasks — neutral
  } else {
    if (signOffRate >= 95) score += 5;
    else if (signOffRate >= 80) score += 2;
    else if (signOffRate < 60) score -= 4;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (completionRate >= 95 && tasks.length > 0) {
    strengths.push(`${completionRate}% task completion rate — exemplary action management and follow-through.`);
  } else if (completionRate >= 80 && tasks.length > 0) {
    strengths.push(`${completionRate}% task completion rate — strong action management across the home.`);
  }

  if (overdueRate === 0 && tasks.length > 0) {
    strengths.push("Zero overdue tasks — all actions are being progressed within expected timescales.");
  } else if (overdueRate <= 5 && tasks.length > 0) {
    strengths.push(`Only ${overdueRate}% of tasks overdue — effective deadline management.`);
  }

  if (onTimeRate >= 95 && completedWithDue.length > 0) {
    strengths.push(`${onTimeRate}% on-time completion — tasks are consistently delivered before their due dates.`);
  } else if (onTimeRate >= 80 && completedWithDue.length > 0) {
    strengths.push(`${onTimeRate}% on-time completion — good timeliness in task delivery.`);
  }

  if (incidentFollowThrough >= 95 && incidents.length > 0) {
    strengths.push(`${incidentFollowThrough}% incident follow-through — every incident generates appropriate actions.`);
  } else if (incidentFollowThrough >= 80 && incidents.length > 0) {
    strengths.push(`${incidentFollowThrough}% incident follow-through — good linkage between incidents and responsive actions.`);
  }

  if (urgentCompletionRate >= 95 && urgentTasks.length > 0) {
    strengths.push(`${urgentCompletionRate}% urgent task completion — critical actions are prioritised and resolved.`);
  } else if (urgentCompletionRate >= 80 && urgentTasks.length > 0) {
    strengths.push(`${urgentCompletionRate}% urgent task completion — good prioritisation of critical actions.`);
  }

  if (signOffRate >= 95 && requiresSignOff.length > 0) {
    strengths.push(`${signOffRate}% sign-off compliance — management governance of completed actions is thorough.`);
  } else if (signOffRate >= 80 && requiresSignOff.length > 0) {
    strengths.push(`${signOffRate}% sign-off compliance — good management oversight of action completion.`);
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (completionRate < 65 && tasks.length > 0) {
    concerns.push(`Only ${completionRate}% task completion rate — ${tasks.length - completedTasks.length} of ${tasks.length} tasks remain incomplete, indicating systemic follow-through failure.`);
  }

  if (overdueRate > 20 && tasks.length > 0) {
    concerns.push(`${overdueCount} tasks overdue (${overdueRate}% of all tasks) — overdue actions accumulate risk and undermine care planning.`);
  }

  if (onTimeRate < 60 && completedWithDue.length > 0) {
    concerns.push(`Only ${onTimeRate}% on-time completion — tasks are routinely completed late, suggesting capacity or prioritisation issues.`);
  }

  if (incidentFollowThrough < 60 && incidents.length > 0) {
    const unlinked = incidents.length - incidentsWithTask.length;
    concerns.push(`Only ${incidentFollowThrough}% incident follow-through — ${unlinked} incidents lack linked actions, creating safeguarding gaps.`);
  }

  if (urgentCompletionRate < 60 && urgentTasks.length > 0) {
    const incompleteUrgent = urgentTasks.length - completedUrgent.length;
    concerns.push(`Only ${urgentCompletionRate}% urgent task completion — ${incompleteUrgent} urgent actions remain unresolved.`);
  }

  if (signOffRate < 60 && requiresSignOff.length > 0) {
    const unsigned = requiresSignOff.length - signedOff.length;
    concerns.push(`Only ${signOffRate}% sign-off compliance — ${unsigned} tasks requiring management sign-off remain unverified.`);
  }

  if (escalationRate > 25 && tasks.length > 0) {
    concerns.push(`${escalationRate}% of tasks have been escalated — high escalation rates suggest tasks are not being addressed at the appropriate level.`);
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recs: TaskActionRecommendation[] = [];
  let rank = 1;

  if (completionRate < 65 && tasks.length > 0) {
    recs.push({ rank: rank++, recommendation: "Improve task completion rate — implement daily task review in handovers and allocate protected time for action completion.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 13" });
  }

  if (overdueRate > 20 && tasks.length > 0) {
    recs.push({ rank: rank++, recommendation: "Address overdue task backlog — prioritise and resolve outstanding actions, escalating to management where deadlines have been significantly exceeded.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 13" });
  }

  if (onTimeRate < 60 && completedWithDue.length > 0) {
    recs.push({ rank: rank++, recommendation: "Improve timeliness of task completion — review workload allocation and ensure deadlines are realistic and monitored through supervision.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 13" });
  }

  if (incidentFollowThrough < 60 && incidents.length > 0) {
    recs.push({ rank: rank++, recommendation: "Ensure all incidents generate linked follow-up actions — every incident must have documented actions to prevent recurrence and evidence safeguarding responses.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 40" });
  }

  if (urgentCompletionRate < 60 && urgentTasks.length > 0) {
    recs.push({ rank: rank++, recommendation: "Prioritise urgent task resolution — urgent actions must be completed promptly to manage immediate risks to children's safety and wellbeing.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 13" });
  }

  if (signOffRate < 60 && requiresSignOff.length > 0) {
    recs.push({ rank: rank++, recommendation: "Establish management sign-off workflow — tasks requiring sign-off must be reviewed and verified by managers to evidence governance and accountability.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 13" });
  }

  if (escalationRate > 25 && tasks.length > 0) {
    recs.push({ rank: rank++, recommendation: "Review escalation patterns — high escalation rates may indicate unclear responsibilities, insufficient training, or unmanageable workloads.", urgency: "planned", regulatory_ref: "CHR 2015 Reg 13" });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: TaskActionInsight[] = [];

  if (completionRate >= 95 && onTimeRate >= 95 && overdueRate === 0 && tasks.length > 0) {
    insights.push({ text: `Task management is exemplary — ${completionRate}% completion, ${onTimeRate}% on-time, zero overdue. Ofsted will see a home where actions are tracked, completed, and evidenced systematically. This supports the SCCIF "Well-led and managed" judgement.`, severity: "positive" });
  }

  if (incidentFollowThrough >= 95 && incidents.length > 0 && completionRate >= 80) {
    insights.push({ text: `Strong incident-to-action linkage at ${incidentFollowThrough}% combined with ${completionRate}% task completion demonstrates that the home responds to incidents with concrete, tracked actions. This evidences effective safeguarding practice under Reg 40.`, severity: "positive" });
  }

  if (urgentCompletionRate >= 95 && urgentTasks.length > 0) {
    insights.push({ text: `All urgent tasks are being completed (${urgentCompletionRate}%). The home demonstrates clear prioritisation of critical actions, ensuring immediate risks to children are addressed without delay.`, severity: "positive" });
  }

  if (completionRate < 50 && tasks.length > 0) {
    insights.push({ text: `Task completion is critically low at ${completionRate}%. More than half of all tasks remain incomplete. Without systematic action completion, the home cannot evidence that care planning decisions are being implemented. Ofsted will view incomplete action trails as a leadership and management failure under Reg 13.`, severity: "critical" });
  }

  if (overdueRate > 20 && tasks.length > 0) {
    insights.push({ text: `${overdueCount} tasks are overdue (${overdueRate}% of all tasks). A backlog of overdue actions creates cumulative risk — each unresolved task may represent a missed safeguarding response, an unaddressed maintenance issue, or an incomplete care planning action. This pattern indicates systemic governance weakness.`, severity: "critical" });
  }

  if (incidentFollowThrough < 60 && incidents.length > 0) {
    insights.push({ text: `Only ${incidentFollowThrough}% of incidents have linked follow-up actions. When incidents occur without generating tracked responses, the home cannot demonstrate that it learns from events or takes steps to prevent recurrence. This is a significant safeguarding concern under Reg 40.`, severity: "critical" });
  }

  if (urgentCompletionRate < 60 && urgentTasks.length > 0) {
    insights.push({ text: `Only ${urgentCompletionRate}% of urgent tasks have been completed. Urgent actions typically relate to immediate safety concerns, incident responses, or regulatory requirements. Leaving urgent tasks incomplete exposes children to ongoing risk.`, severity: "critical" });
  }

  if (signOffRate < 60 && requiresSignOff.length > 0) {
    insights.push({ text: `Only ${signOffRate}% of tasks requiring sign-off have been verified by management. Without management sign-off, completed actions lack the governance oversight expected under Reg 13. This gap means the registered manager cannot demonstrate they are monitoring the quality and timeliness of task completion.`, severity: "warning" });
  }

  if (escalationRate > 25 && tasks.length > 0) {
    insights.push({ text: `${escalationRate}% of tasks have been escalated. While escalation can be appropriate, a high rate may indicate that staff lack the authority, training, or resources to complete tasks at their level. Review whether escalation reflects genuine complexity or systemic capacity issues.`, severity: "warning" });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding task management — ${completionRate}% completion, ${onTimeRate}% on-time, ${overdueCount} overdue.`;
  } else if (rating === "good") {
    headline = "Good task management — solid completion and follow-through with minor gaps in timeliness or governance.";
  } else if (rating === "adequate") {
    headline = "Adequate task management — completion and timeliness rates need improvement to fully evidence effective action tracking.";
  } else {
    headline = "Task management is inadequate — low completion rates, overdue actions, or poor incident follow-through undermine care governance.";
  }

  return {
    task_rating: rating,
    task_score: score,
    headline,
    total_tasks: allTasks.length,
    completion_rate: completionRate,
    overdue_count: overdueCount,
    on_time_rate: onTimeRate,
    incident_follow_through: incidentFollowThrough,
    urgent_completion_rate: urgentCompletionRate,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}
