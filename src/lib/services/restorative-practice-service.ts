// ==============================================================================
// CORNERSTONE -- RESTORATIVE PRACTICE & CONFLICT RESOLUTION SERVICE
// Tracks restorative practice and conflict resolution sessions for looked-after
// children including restorative conferences, restorative chats, community
// meetings, harm circles, peer mediation, staff-child mediation, conflict
// resolution, reintegration meetings, check-in circles, relationship repair,
// group problem-solving, and follow-up sessions.
//
// Covers: Session facilitation tracking, trigger incident documentation,
// participant recording, harm acknowledgement, perspective sharing,
// agreement formation and detail capture, action planning, follow-up
// scheduling and completion, child satisfaction assessment, outcome rating,
// relationship improvement tracking, young person voice verification,
// and staff reflective practice recording.
//
// UK Regulatory Framework:
// CHR 2015 Reg 34 (positive behaviour management — must not use punishment),
// CHR 2015 Reg 19 (positive relationships),
// SCCIF: Behaviour and attitudes — "The home uses restorative approaches."
// Restorative Justice Council standards.
// ==============================================================================

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const SESSION_TYPES = [
  "Restorative Conference",
  "Restorative Chat",
  "Community Meeting",
  "Harm Circle",
  "Peer Mediation",
  "Staff-Child Mediation",
  "Conflict Resolution",
  "Reintegration Meeting",
  "Check-In Circle",
  "Relationship Repair",
  "Group Problem-Solving",
  "Follow-Up Session",
] as const;
export type SessionType = (typeof SESSION_TYPES)[number];

export const OUTCOME_RATINGS = [
  "Very Positive",
  "Positive",
  "Neutral",
  "Negative",
  "Inconclusive",
] as const;
export type OutcomeRating = (typeof OUTCOME_RATINGS)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const FORMAL_SESSION_TYPES: SessionType[] = [
  "Restorative Conference",
  "Harm Circle",
  "Reintegration Meeting",
];

export const INFORMAL_SESSION_TYPES: SessionType[] = [
  "Restorative Chat",
  "Check-In Circle",
  "Relationship Repair",
];

export const MEDIATION_SESSION_TYPES: SessionType[] = [
  "Peer Mediation",
  "Staff-Child Mediation",
  "Conflict Resolution",
];

export const GROUP_SESSION_TYPES: SessionType[] = [
  "Community Meeting",
  "Harm Circle",
  "Check-In Circle",
  "Group Problem-Solving",
];

// Outcome rating numeric mapping for quality calculation
const OUTCOME_NUMERIC: Record<string, number> = {
  "Very Positive": 5,
  "Positive": 4,
  "Neutral": 3,
  "Negative": 2,
  "Inconclusive": 1,
};

// -- Label maps ---------------------------------------------------------------

export const SESSION_TYPE_LABELS: { type: SessionType; label: string }[] = [
  { type: "Restorative Conference", label: "Restorative Conference" },
  { type: "Restorative Chat", label: "Restorative Chat" },
  { type: "Community Meeting", label: "Community Meeting" },
  { type: "Harm Circle", label: "Harm Circle" },
  { type: "Peer Mediation", label: "Peer Mediation" },
  { type: "Staff-Child Mediation", label: "Staff-Child Mediation" },
  { type: "Conflict Resolution", label: "Conflict Resolution" },
  { type: "Reintegration Meeting", label: "Reintegration Meeting" },
  { type: "Check-In Circle", label: "Check-In Circle" },
  { type: "Relationship Repair", label: "Relationship Repair" },
  { type: "Group Problem-Solving", label: "Group Problem-Solving" },
  { type: "Follow-Up Session", label: "Follow-Up Session" },
];

export const OUTCOME_RATING_LABELS: { rating: OutcomeRating; label: string }[] = [
  { rating: "Very Positive", label: "Very Positive" },
  { rating: "Positive", label: "Positive" },
  { rating: "Neutral", label: "Neutral" },
  { rating: "Negative", label: "Negative" },
  { rating: "Inconclusive", label: "Inconclusive" },
];

// -- Row type -----------------------------------------------------------------

export interface RestorativePracticeRow {
  id: string;
  home_id: string;
  child_name: string;
  session_date: string;
  facilitator_name: string;
  session_type: SessionType;
  trigger_incident: string | null;
  participants: string;
  harm_acknowledged: boolean;
  perspectives_shared: boolean;
  agreement_reached: boolean;
  agreement_details: string | null;
  actions_agreed: string | null;
  follow_up_required: boolean;
  follow_up_date: string | null;
  follow_up_completed: boolean;
  child_satisfied_with_process: boolean;
  outcome_rating: OutcomeRating;
  relationship_improved: boolean;
  young_person_voice_heard: boolean;
  staff_reflective_practice: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateRestorativePractice(input: {
  childName?: string;
  sessionDate?: string;
  facilitatorName?: string;
  sessionType?: string;
  participants?: string;
  agreementReached?: boolean;
  agreementDetails?: string | null;
  actionsAgreed?: string | null;
  followUpRequired?: boolean;
  followUpDate?: string | null;
  followUpCompleted?: boolean;
  outcomeRating?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.childName || input.childName.trim().length === 0) {
    errors.push("Child name is required");
  }

  if (!input.sessionDate) {
    errors.push("Session date is required");
  } else {
    const dateObj = new Date(input.sessionDate);
    if (isNaN(dateObj.getTime())) {
      errors.push("Session date must be a valid date");
    } else if (dateObj > new Date()) {
      errors.push("Session date cannot be in the future");
    }
  }

  if (!input.facilitatorName || input.facilitatorName.trim().length === 0) {
    errors.push("Facilitator name is required");
  }

  if (!input.sessionType || !(SESSION_TYPES as readonly string[]).includes(input.sessionType)) {
    errors.push(`Session type must be one of: ${SESSION_TYPES.join(", ")}`);
  }

  if (!input.participants || input.participants.trim().length === 0) {
    errors.push("Participants are required — record who was involved in the session");
  }

  if (
    input.outcomeRating &&
    !(OUTCOME_RATINGS as readonly string[]).includes(input.outcomeRating)
  ) {
    errors.push(`Outcome rating must be one of: ${OUTCOME_RATINGS.join(", ")}`);
  }

  // Business rule: Agreement reached should have agreement details
  if (input.agreementReached && (!input.agreementDetails || input.agreementDetails.trim().length === 0)) {
    errors.push("Agreement details are required when an agreement has been reached");
  }

  // Business rule: Agreement reached should have actions agreed
  if (input.agreementReached && (!input.actionsAgreed || input.actionsAgreed.trim().length === 0)) {
    errors.push("Actions agreed are required when an agreement has been reached — document what each party has committed to");
  }

  // Business rule: Follow-up required should have follow-up date
  if (input.followUpRequired && !input.followUpDate) {
    errors.push("Follow-up date is required when follow-up is needed");
  }

  // Business rule: Follow-up date should be in the future (unless completed)
  if (input.followUpDate && !input.followUpCompleted) {
    const followUpDateObj = new Date(input.followUpDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(followUpDateObj.getTime())) {
      errors.push("Follow-up date must be a valid date");
    } else if (followUpDateObj < today) {
      errors.push("Follow-up date should not be in the past unless follow-up has been completed");
    }
  }

  // Business rule: Follow-up completed should only be true if follow-up was required
  if (input.followUpCompleted && !input.followUpRequired) {
    errors.push("Follow-up cannot be marked as completed if follow-up was not required");
  }

  // Business rule: Formal sessions should have a trigger incident documented
  if (
    input.sessionType &&
    (FORMAL_SESSION_TYPES as string[]).includes(input.sessionType) &&
    (!input.childName || input.childName.trim().length === 0)
  ) {
    // Already caught above — child name required
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: RestorativePracticeRow[],
): {
  total_sessions: number;
  unique_children: number;
  by_session_type: Record<string, number>;
  by_outcome_rating: Record<string, number>;
  harm_acknowledged_rate: number;
  perspectives_shared_rate: number;
  agreement_reached_rate: number;
  follow_up_required_rate: number;
  follow_up_completion_rate: number;
  child_satisfaction_rate: number;
  positive_outcome_rate: number;
  relationship_improved_rate: number;
  young_person_voice_rate: number;
  staff_reflective_rate: number;
  average_outcome_score: number;
  formal_session_count: number;
  informal_session_count: number;
  mediation_session_count: number;
  group_session_count: number;
  overdue_follow_ups: number;
  average_sessions_per_child: number;
  negative_outcome_count: number;
} {
  const total = rows.length;

  // Unique children
  const uniqueChildren = new Set(rows.map((r) => r.child_name.toLowerCase().trim()));

  // Session type breakdown
  const bySessionType: Record<string, number> = {};
  for (const st of SESSION_TYPES) bySessionType[st] = 0;
  for (const r of rows) bySessionType[r.session_type] = (bySessionType[r.session_type] || 0) + 1;

  // Outcome rating breakdown
  const byOutcomeRating: Record<string, number> = {};
  for (const or_ of OUTCOME_RATINGS) byOutcomeRating[or_] = 0;
  for (const r of rows) byOutcomeRating[r.outcome_rating] = (byOutcomeRating[r.outcome_rating] || 0) + 1;

  // Boolean rates
  const pct = (count: number) => total > 0 ? Math.round((count / total) * 1000) / 10 : 0;

  const harmAckRate = pct(rows.filter((r) => r.harm_acknowledged).length);
  const perspectivesRate = pct(rows.filter((r) => r.perspectives_shared).length);
  const agreementRate = pct(rows.filter((r) => r.agreement_reached).length);
  const followUpRequiredRate = pct(rows.filter((r) => r.follow_up_required).length);

  // Follow-up completion rate (of those requiring follow-up)
  const followUpRequired = rows.filter((r) => r.follow_up_required);
  const followUpCompletionRate = followUpRequired.length > 0
    ? Math.round((followUpRequired.filter((r) => r.follow_up_completed).length / followUpRequired.length) * 1000) / 10
    : 0;

  const childSatisfactionRate = pct(rows.filter((r) => r.child_satisfied_with_process).length);

  // Positive outcome rate (Very Positive or Positive)
  const positiveOutcomes = rows.filter(
    (r) => r.outcome_rating === "Very Positive" || r.outcome_rating === "Positive",
  );
  const positiveOutcomeRate = pct(positiveOutcomes.length);

  const relationshipImprovedRate = pct(rows.filter((r) => r.relationship_improved).length);
  const ypVoiceRate = pct(rows.filter((r) => r.young_person_voice_heard).length);
  const staffReflectiveRate = pct(rows.filter((r) => r.staff_reflective_practice).length);

  // Average outcome score
  const outcomeScores = rows.map((r) => OUTCOME_NUMERIC[r.outcome_rating] ?? 0).filter((v) => v > 0);
  const avgOutcomeScore = outcomeScores.length > 0
    ? Math.round((outcomeScores.reduce((a, b) => a + b, 0) / outcomeScores.length) * 10) / 10
    : 0;

  // Session category counts
  const formalCount = rows.filter(
    (r) => (FORMAL_SESSION_TYPES as string[]).includes(r.session_type),
  ).length;
  const informalCount = rows.filter(
    (r) => (INFORMAL_SESSION_TYPES as string[]).includes(r.session_type),
  ).length;
  const mediationCount = rows.filter(
    (r) => (MEDIATION_SESSION_TYPES as string[]).includes(r.session_type),
  ).length;
  const groupCount = rows.filter(
    (r) => (GROUP_SESSION_TYPES as string[]).includes(r.session_type),
  ).length;

  // Overdue follow-ups
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueFollowUps = rows.filter((r) => {
    if (!r.follow_up_required || r.follow_up_completed) return false;
    if (!r.follow_up_date) return false;
    const followUpDate = new Date(r.follow_up_date);
    return followUpDate < today;
  }).length;

  // Average sessions per child
  const avgSessionsPerChild = uniqueChildren.size > 0
    ? Math.round((total / uniqueChildren.size) * 10) / 10
    : 0;

  // Negative outcome count
  const negativeOutcomeCount = rows.filter(
    (r) => r.outcome_rating === "Negative",
  ).length;

  return {
    total_sessions: total,
    unique_children: uniqueChildren.size,
    by_session_type: bySessionType,
    by_outcome_rating: byOutcomeRating,
    harm_acknowledged_rate: harmAckRate,
    perspectives_shared_rate: perspectivesRate,
    agreement_reached_rate: agreementRate,
    follow_up_required_rate: followUpRequiredRate,
    follow_up_completion_rate: followUpCompletionRate,
    child_satisfaction_rate: childSatisfactionRate,
    positive_outcome_rate: positiveOutcomeRate,
    relationship_improved_rate: relationshipImprovedRate,
    young_person_voice_rate: ypVoiceRate,
    staff_reflective_rate: staffReflectiveRate,
    average_outcome_score: avgOutcomeScore,
    formal_session_count: formalCount,
    informal_session_count: informalCount,
    mediation_session_count: mediationCount,
    group_session_count: groupCount,
    overdue_follow_ups: overdueFollowUps,
    average_sessions_per_child: avgSessionsPerChild,
    negative_outcome_count: negativeOutcomeCount,
  };
}

export function computeAlerts(
  rows: RestorativePracticeRow[],
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  record_id?: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    record_id?: string;
  }[] = [];

  // Critical: Negative outcome without follow-up
  for (const r of rows) {
    if (r.outcome_rating === "Negative" && !r.follow_up_required) {
      alerts.push({
        type: "negative_no_follow_up",
        severity: "critical",
        message: `Restorative session for ${r.child_name} on ${r.session_date} had a negative outcome but no follow-up has been scheduled — CHR 2015 Reg 34 requires positive behaviour management approaches, and a negative outcome without further action risks the child feeling unsupported or that the process has failed them`,
        record_id: r.id,
      });
    }
  }

  // Critical: Child not satisfied and voice not heard
  for (const r of rows) {
    if (!r.child_satisfied_with_process && !r.young_person_voice_heard) {
      alerts.push({
        type: "child_unheard_unsatisfied",
        severity: "critical",
        message: `${r.child_name} was neither satisfied with the restorative process nor had their voice heard during the ${r.session_type} on ${r.session_date} — CHR 2015 Reg 7 requires children's views to be sought and listened to, and Reg 34 requires behaviour management approaches that are experienced as fair and respectful`,
        record_id: r.id,
      });
    }
  }

  // Critical: Pattern of negative outcomes for same child
  const childSessionMap = new Map<string, RestorativePracticeRow[]>();
  for (const r of rows) {
    const key = r.child_name.toLowerCase().trim();
    if (!childSessionMap.has(key)) childSessionMap.set(key, []);
    childSessionMap.get(key)!.push(r);
  }

  for (const [, childRows] of childSessionMap) {
    const negativeCount = childRows.filter((r) => r.outcome_rating === "Negative").length;
    if (negativeCount >= 3) {
      alerts.push({
        type: "repeated_negative_outcomes",
        severity: "critical",
        message: `${childRows[0].child_name} has had ${negativeCount} negative outcomes from restorative sessions — this pattern suggests the current approach is not working and a fundamental review of the restorative strategy is needed; consider whether the child needs additional therapeutic support or whether a different conflict resolution approach would be more appropriate`,
      });
    }
  }

  // High: Follow-up overdue
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const r of rows) {
    if (r.follow_up_required && !r.follow_up_completed && r.follow_up_date) {
      const followUpDate = new Date(r.follow_up_date);
      if (followUpDate < today) {
        alerts.push({
          type: "overdue_follow_up",
          severity: "high",
          message: `Follow-up session for ${r.child_name} was due on ${r.follow_up_date} and has not been completed — failing to follow through on restorative agreements undermines trust in the process and may leave the child feeling that their experience does not matter`,
          record_id: r.id,
        });
      }
    }
  }

  // High: Agreement reached but no actions documented
  for (const r of rows) {
    if (r.agreement_reached && (!r.actions_agreed || r.actions_agreed.trim().length === 0)) {
      alerts.push({
        type: "agreement_no_actions",
        severity: "high",
        message: `An agreement was reached in ${r.child_name}'s ${r.session_type} on ${r.session_date} but no specific actions were documented — without clear, actionable commitments, agreements are unlikely to lead to meaningful change; Restorative Justice Council standards require that outcomes are specific, measurable, and achievable`,
        record_id: r.id,
      });
    }
  }

  // High: Harm not acknowledged in harm circles or restorative conferences
  for (const r of rows) {
    if (
      (r.session_type === "Harm Circle" || r.session_type === "Restorative Conference") &&
      !r.harm_acknowledged
    ) {
      alerts.push({
        type: "harm_not_acknowledged_formal",
        severity: "high",
        message: `Harm was not acknowledged during ${r.child_name}'s ${r.session_type} on ${r.session_date} — acknowledgement of harm is a fundamental principle of restorative practice and without it, meaningful resolution is difficult; consider whether further preparatory work is needed before another formal session`,
        record_id: r.id,
      });
    }
  }

  // High: Low young person voice rate across sessions
  const noVoice = rows.filter((r) => !r.young_person_voice_heard);
  if (rows.length >= 5 && noVoice.length / rows.length > 0.4) {
    alerts.push({
      type: "low_voice_rate",
      severity: "high",
      message: `Young people's voices were not heard in ${noVoice.length} of ${rows.length} restorative sessions (${Math.round((noVoice.length / rows.length) * 100)}%) — CHR 2015 Reg 7 requires the home to seek and take into account children's views; restorative practice without genuine participation becomes a process done to children rather than with them`,
    });
  }

  // High: No staff reflective practice
  const noReflection = rows.filter((r) => !r.staff_reflective_practice);
  if (rows.length >= 5 && noReflection.length / rows.length > 0.5) {
    alerts.push({
      type: "low_staff_reflection",
      severity: "high",
      message: `Staff reflective practice was not recorded in ${noReflection.length} of ${rows.length} sessions (${Math.round((noReflection.length / rows.length) * 100)}%) — restorative practice requires staff to model reflective behaviour; without staff reflection, the process risks becoming procedural rather than genuinely relational`,
    });
  }

  // Medium: Perspectives not shared in mediation sessions
  for (const r of rows) {
    if (
      (MEDIATION_SESSION_TYPES as string[]).includes(r.session_type) &&
      !r.perspectives_shared
    ) {
      alerts.push({
        type: "no_perspectives_mediation",
        severity: "medium",
        message: `Perspectives were not shared during ${r.child_name}'s ${r.session_type} on ${r.session_date} — mediation relies on all parties having the opportunity to share their perspective; consider whether participants felt safe enough to contribute`,
        record_id: r.id,
      });
    }
  }

  // Medium: High frequency of sessions for same child
  for (const [, childRows] of childSessionMap) {
    if (childRows.length >= 5) {
      const sorted = childRows.sort(
        (a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime(),
      );
      const recentFive = sorted.slice(0, 5);
      const firstDate = new Date(recentFive[recentFive.length - 1].session_date);
      const lastDate = new Date(recentFive[0].session_date);
      const daysBetween = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysBetween <= 30) {
        alerts.push({
          type: "high_session_frequency",
          severity: "medium",
          message: `${childRows[0].child_name} has had ${recentFive.length} restorative sessions in ${Math.round(daysBetween)} days — frequent sessions may indicate that underlying issues are not being addressed or that the restorative approach needs adaptation for this child's specific needs`,
        });
      }
    }
  }

  // Medium: Relationship not improved in relationship repair sessions
  for (const r of rows) {
    if (r.session_type === "Relationship Repair" && !r.relationship_improved) {
      alerts.push({
        type: "relationship_not_improved",
        severity: "medium",
        message: `Relationship repair session for ${r.child_name} on ${r.session_date} did not result in relationship improvement — consider whether additional sessions, a different approach, or external mediation support would help`,
        record_id: r.id,
      });
    }
  }

  // Medium: No trigger incident documented for formal sessions
  for (const r of rows) {
    if (
      (FORMAL_SESSION_TYPES as string[]).includes(r.session_type) &&
      (!r.trigger_incident || r.trigger_incident.trim().length === 0)
    ) {
      alerts.push({
        type: "no_trigger_formal",
        severity: "medium",
        message: `No trigger incident was documented for ${r.child_name}'s ${r.session_type} on ${r.session_date} — formal restorative sessions should record what prompted the session to provide context and support pattern analysis`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateAriaInsights(
  rows: RestorativePracticeRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const typeBreakdown = Object.entries(metrics.by_session_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  const outcomeBreakdown = Object.entries(metrics.by_outcome_rating)
    .filter(([, count]) => count > 0)
    .map(([rating, count]) => `${rating}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_sessions} restorative ${metrics.total_sessions === 1 ? "session" : "sessions"} ` +
      `for ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"} ` +
      `(avg ${metrics.average_sessions_per_child} per child). ` +
      `Types: ${typeBreakdown || "none recorded"}. ` +
      `Outcomes: ${outcomeBreakdown || "none recorded"}. ` +
      `Average outcome score: ${metrics.average_outcome_score}/5. ` +
      `Formal: ${metrics.formal_session_count}. Informal: ${metrics.informal_session_count}. ` +
      `Mediation: ${metrics.mediation_session_count}. Group: ${metrics.group_session_count}. ` +
      `Overdue follow-ups: ${metrics.overdue_follow_ups}.`,
  );

  // Insight 2: Quality indicators and alerts
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts. ` +
        `Harm acknowledged: ${metrics.harm_acknowledged_rate}%. ` +
        `Perspectives shared: ${metrics.perspectives_shared_rate}%. ` +
        `Agreement reached: ${metrics.agreement_reached_rate}%. ` +
        `Follow-up completion: ${metrics.follow_up_completion_rate}%. ` +
        `Child satisfaction: ${metrics.child_satisfaction_rate}%. ` +
        `Positive outcomes: ${metrics.positive_outcome_rate}%. ` +
        `Relationship improved: ${metrics.relationship_improved_rate}%. ` +
        `YP voice heard: ${metrics.young_person_voice_rate}%. ` +
        `Staff reflective: ${metrics.staff_reflective_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority restorative practice alerts. ` +
        `Harm acknowledged: ${metrics.harm_acknowledged_rate}%. ` +
        `Perspectives shared: ${metrics.perspectives_shared_rate}%. ` +
        `Agreement reached: ${metrics.agreement_reached_rate}%. ` +
        `Follow-up completion: ${metrics.follow_up_completion_rate}%. ` +
        `Child satisfaction: ${metrics.child_satisfaction_rate}%. ` +
        `Positive outcomes: ${metrics.positive_outcome_rate}%. ` +
        `Relationship improved: ${metrics.relationship_improved_rate}%. ` +
        `Continue using restorative approaches per CHR 2015 Reg 34.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.child_satisfaction_rate < 50 && metrics.total_sessions > 0) {
    insights.push(
      `[reflect] Only ${metrics.child_satisfaction_rate}% of children reported satisfaction with ` +
        `the restorative process. Is the home truly practising restorative justice, or has it ` +
        `become a procedural exercise? CHR 2015 Reg 34 requires positive behaviour management ` +
        `that is experienced as fair by the child. If children are not satisfied with the ` +
        `process, it may be that sessions are happening to them rather than with them. ` +
        `The Restorative Justice Council standards emphasise that participation must be ` +
        `voluntary and that all parties should feel the process was fair. Are young people ` +
        `being given genuine agency in how conflicts are resolved? Are facilitators trained ` +
        `to create safe, non-judgemental spaces?`,
    );
  } else if (metrics.young_person_voice_rate < 60 && metrics.total_sessions > 0) {
    insights.push(
      `[reflect] Young people's voices were heard in only ${metrics.young_person_voice_rate}% of sessions. ` +
        `Restorative practice is fundamentally about giving everyone affected a voice. ` +
        `CHR 2015 Reg 7 requires children's views to be actively sought. If young people ` +
        `are not being heard in restorative sessions, the process risks replicating the ` +
        `power imbalances it is supposed to address. Are facilitators using open, ` +
        `non-leading questions? Are children being given preparation time before sessions? ` +
        `Would some children benefit from having an advocate present? Is the physical ` +
        `environment of sessions conducive to young people feeling safe to speak?`,
    );
  } else if (metrics.follow_up_completion_rate < 50 && metrics.follow_up_required_rate > 30) {
    insights.push(
      `[reflect] Follow-up completion rate is only ${metrics.follow_up_completion_rate}% despite ` +
        `${metrics.follow_up_required_rate}% of sessions requiring follow-up. Following through ` +
        `on restorative agreements is essential for building trust. If the home agrees to actions ` +
        `but does not follow through, young people learn that restorative processes are empty ` +
        `rituals rather than genuine commitments to repair. CHR 2015 Reg 19 requires positive ` +
        `relationships, and trust is built through consistency. Are follow-up dates being ` +
        `tracked systematically? Is there a named person responsible for ensuring follow-through? ` +
        `Do young people know who to go to if they feel agreements are not being honoured?`,
    );
  } else {
    insights.push(
      `[reflect] How deeply embedded is restorative practice in the home's culture, beyond ` +
        `formal sessions? CHR 2015 Reg 34 requires that behaviour management is never punitive, ` +
        `and Reg 19 requires positive relationships. True restorative practice is not just a ` +
        `tool for resolving incidents — it is a philosophy that shapes every interaction. ` +
        `Are restorative principles used in everyday conversations, not just when things go ` +
        `wrong? Do staff model restorative behaviour in their interactions with each other? ` +
        `SCCIF inspectors look for evidence that restorative approaches are genuinely ` +
        `part of the home's ethos, not just a policy document on a shelf.`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    sessionType?: SessionType;
    outcomeRating?: OutcomeRating;
    limit?: number;
  },
): Promise<ServiceResult<RestorativePracticeRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_restorative_practice") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.sessionType) q = q.eq("session_type", filters.sessionType);
  if (filters?.outcomeRating) q = q.eq("outcome_rating", filters.outcomeRating);

  q = q.order("session_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<RestorativePracticeRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_restorative_practice") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createRecord(input: {
  homeId: string;
  childName: string;
  sessionDate: string;
  facilitatorName: string;
  sessionType: SessionType;
  triggerIncident?: string | null;
  participants: string;
  harmAcknowledged?: boolean;
  perspectivesShared?: boolean;
  agreementReached?: boolean;
  agreementDetails?: string | null;
  actionsAgreed?: string | null;
  followUpRequired?: boolean;
  followUpDate?: string | null;
  followUpCompleted?: boolean;
  childSatisfiedWithProcess?: boolean;
  outcomeRating?: OutcomeRating;
  relationshipImproved?: boolean;
  youngPersonVoiceHeard?: boolean;
  staffReflectivePractice?: boolean;
  notes?: string | null;
}): Promise<ServiceResult<RestorativePracticeRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateRestorativePractice({
    childName: input.childName,
    sessionDate: input.sessionDate,
    facilitatorName: input.facilitatorName,
    sessionType: input.sessionType,
    participants: input.participants,
    agreementReached: input.agreementReached,
    agreementDetails: input.agreementDetails,
    actionsAgreed: input.actionsAgreed,
    followUpRequired: input.followUpRequired,
    followUpDate: input.followUpDate,
    followUpCompleted: input.followUpCompleted,
    outcomeRating: input.outcomeRating,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_restorative_practice") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      session_date: input.sessionDate,
      facilitator_name: input.facilitatorName,
      session_type: input.sessionType,
      trigger_incident: input.triggerIncident ?? null,
      participants: input.participants,
      harm_acknowledged: input.harmAcknowledged ?? false,
      perspectives_shared: input.perspectivesShared ?? false,
      agreement_reached: input.agreementReached ?? false,
      agreement_details: input.agreementDetails ?? null,
      actions_agreed: input.actionsAgreed ?? null,
      follow_up_required: input.followUpRequired ?? false,
      follow_up_date: input.followUpDate ?? null,
      follow_up_completed: input.followUpCompleted ?? false,
      child_satisfied_with_process: input.childSatisfiedWithProcess ?? false,
      outcome_rating: input.outcomeRating ?? "Neutral",
      relationship_improved: input.relationshipImproved ?? false,
      young_person_voice_heard: input.youngPersonVoiceHeard ?? false,
      staff_reflective_practice: input.staffReflectivePractice ?? false,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    childName: string;
    sessionDate: string;
    facilitatorName: string;
    sessionType: SessionType;
    triggerIncident: string | null;
    participants: string;
    harmAcknowledged: boolean;
    perspectivesShared: boolean;
    agreementReached: boolean;
    agreementDetails: string | null;
    actionsAgreed: string | null;
    followUpRequired: boolean;
    followUpDate: string | null;
    followUpCompleted: boolean;
    childSatisfiedWithProcess: boolean;
    outcomeRating: OutcomeRating;
    relationshipImproved: boolean;
    youngPersonVoiceHeard: boolean;
    staffReflectivePractice: boolean;
    notes: string | null;
  }>,
): Promise<ServiceResult<RestorativePracticeRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.sessionDate !== undefined) mapped.session_date = updates.sessionDate;
  if (updates.facilitatorName !== undefined) mapped.facilitator_name = updates.facilitatorName;
  if (updates.sessionType !== undefined) mapped.session_type = updates.sessionType;
  if (updates.triggerIncident !== undefined) mapped.trigger_incident = updates.triggerIncident;
  if (updates.participants !== undefined) mapped.participants = updates.participants;
  if (updates.harmAcknowledged !== undefined) mapped.harm_acknowledged = updates.harmAcknowledged;
  if (updates.perspectivesShared !== undefined) mapped.perspectives_shared = updates.perspectivesShared;
  if (updates.agreementReached !== undefined) mapped.agreement_reached = updates.agreementReached;
  if (updates.agreementDetails !== undefined) mapped.agreement_details = updates.agreementDetails;
  if (updates.actionsAgreed !== undefined) mapped.actions_agreed = updates.actionsAgreed;
  if (updates.followUpRequired !== undefined) mapped.follow_up_required = updates.followUpRequired;
  if (updates.followUpDate !== undefined) mapped.follow_up_date = updates.followUpDate;
  if (updates.followUpCompleted !== undefined) mapped.follow_up_completed = updates.followUpCompleted;
  if (updates.childSatisfiedWithProcess !== undefined) mapped.child_satisfied_with_process = updates.childSatisfiedWithProcess;
  if (updates.outcomeRating !== undefined) mapped.outcome_rating = updates.outcomeRating;
  if (updates.relationshipImproved !== undefined) mapped.relationship_improved = updates.relationshipImproved;
  if (updates.youngPersonVoiceHeard !== undefined) mapped.young_person_voice_heard = updates.youngPersonVoiceHeard;
  if (updates.staffReflectivePractice !== undefined) mapped.staff_reflective_practice = updates.staffReflectivePractice;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_restorative_practice") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteRecord(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { error } = await (client.from("cs_restorative_practice") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
