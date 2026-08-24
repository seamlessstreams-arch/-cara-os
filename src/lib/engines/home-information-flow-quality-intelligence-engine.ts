// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME INFORMATION FLOW QUALITY INTELLIGENCE ENGINE
// Cross-cutting composite: assesses whether important information flows
// effectively through the home — combining handovers, daily logs, care events,
// and notifications to identify communication gaps.
// CHR 2015 Reg 13 (Leadership & Management), Reg 36 (Records).
// SCCIF: "Well-Led", "Safe" — information continuity underpins safety.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface HandoverInput {
  id: string;
  shift_date: string;
  shift_type: string; // "day" | "night" | "late" | "early"
  handed_over_by: string;
  received_by: string;
  has_content: boolean;
  items_count: number;
  urgent_items_count: number;
  children_mentioned_count: number;
  total_children: number;
  completed: boolean;
  created_at: string;
}

export interface DailyLogInput {
  id: string;
  child_id: string;
  date: string;
  staff_id: string;
  has_content: boolean;
  word_count: number;
  categories_count: number; // how many log categories covered
  has_mood_rating: boolean;
  has_incident_reference: boolean;
  created_at: string;
}

export interface CareEventSummaryInput {
  id: string;
  child_id: string;
  staff_id: string;
  category: string;
  date: string;
  is_significant: boolean;
  is_verified: boolean;
  has_handover_note: boolean; // flagged for handover
  has_follow_up: boolean;
}

export interface NotificationSummaryInput {
  id: string;
  recipient_id: string;
  priority: string; // "urgent" | "high" | "normal" | "low"
  read: boolean;
  entity_type: string | null;
  created_at: string;
}

export interface InformationFlowQualityInput {
  today: string;
  total_staff: number;
  total_children: number;
  handovers: HandoverInput[];
  daily_logs: DailyLogInput[];
  care_events: CareEventSummaryInput[];
  notifications: NotificationSummaryInput[];
}

// ── Result Types ────────────────────────────────────────────────────────────

export type InformationFlowRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface InformationFlowQualityResult {
  flow_rating: InformationFlowRating;
  flow_score: number; // 0-100
  headline: string;
  /** null when the population is empty — nothing measured, not 0%. */
  handover_completion_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  handover_content_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  daily_log_coverage_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  daily_log_quality_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  significant_event_handover_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  care_event_verification_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  notification_read_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  urgent_notification_read_rate: number | null;
  information_continuity_score: number;
  /** null when the population is empty — nothing measured, not 0%. */
  staff_engagement_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: {
    rank: number;
    recommendation: string;
    urgency: "immediate" | "soon" | "planned";
    regulatory_ref?: string;
  }[];
  insights: { text: string; severity: "critical" | "warning" | "positive" }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): InformationFlowRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeInformationFlowQuality(
  input: InformationFlowQualityInput,
): InformationFlowQualityResult {
  const {
    total_staff,
    total_children,
    handovers,
    daily_logs,
    care_events,
    notifications,
  } = input;

  const allEmpty =
    handovers.length === 0 &&
    daily_logs.length === 0 &&
    care_events.length === 0 &&
    notifications.length === 0;

  // ── Special case: insufficient_data ──────────────────────────────
  if (allEmpty && total_children === 0 && total_staff === 0) {
    return emptyResult("insufficient_data", 0, "Insufficient data — no children, staff, or activity records to assess information flow.");
  }

  // ── Special case: all empty but children exist → inadequate ─────
  if (allEmpty && total_children > 0) {
    return emptyResult(
      "inadequate",
      15,
      "No information flow activity recorded despite children in placement — critical communication failure.",
    );
  }

  // ── Handover metrics ─────────────────────────────────────────────
  const handoverCompletedCount = handovers.filter(h => h.completed).length;
  const handoverCompletionRate = pct(handoverCompletedCount, handovers.length);

  const handoverWithContentCount = handovers.filter(h => h.has_content).length;
  const handoverContentRate = pct(handoverWithContentCount, handovers.length);

  // ── Daily log metrics ────────────────────────────────────────────
  // Coverage: % of children who have at least one daily log
  const childrenWithLogs = new Set(daily_logs.map(l => l.child_id));
  const dailyLogCoverageRate = pct(childrenWithLogs.size, total_children);

  // Quality: % of logs with word_count >= 50
  const qualityLogs = daily_logs.filter(l => l.word_count >= 50);
  const dailyLogQualityRate = pct(qualityLogs.length, daily_logs.length);

  // ── Care event metrics ───────────────────────────────────────────
  const significantEvents = care_events.filter(e => e.is_significant);
  const significantWithHandover = significantEvents.filter(e => e.has_handover_note);
  const significantEventHandoverRate = pct(significantWithHandover.length, significantEvents.length);

  const verifiedEvents = care_events.filter(e => e.is_verified);
  const careEventVerificationRate = pct(verifiedEvents.length, care_events.length);

  // ── Notification metrics ─────────────────────────────────────────
  const readNotifications = notifications.filter(n => n.read);
  const notificationReadRate = pct(readNotifications.length, notifications.length);

  const urgentHighNotifications = notifications.filter(
    n => n.priority === "urgent" || n.priority === "high",
  );
  const urgentHighRead = urgentHighNotifications.filter(n => n.read);
  const urgentNotificationReadRate = pct(urgentHighRead.length, urgentHighNotifications.length);

  // ── Information continuity score ─────────────────────────────────
  // Simple average of: handover_completion_rate, daily_log_coverage_rate,
  // care_event_verification_rate, notification_read_rate
  const informationContinuityScore = Math.round(
    (handoverCompletionRate + dailyLogCoverageRate + careEventVerificationRate + notificationReadRate) / 4,
  );

  // ── Staff engagement rate ────────────────────────────────────────
  // % of staff appearing in logs, events, or handovers
  const engagedStaff = new Set<string>();
  for (const h of handovers) {
    engagedStaff.add(h.handed_over_by);
    engagedStaff.add(h.received_by);
  }
  for (const l of daily_logs) {
    engagedStaff.add(l.staff_id);
  }
  for (const e of care_events) {
    engagedStaff.add(e.staff_id);
  }
  const staffEngagementRate = pct(engagedStaff.size, total_staff);

  // ── Scoring ──────────────────────────────────────────────────────
  let score = 52;

  // Bonuses
  if (handoverCompletionRate >= 95) score += 4;
  else if (handoverCompletionRate >= 80) score += 2;

  if (handoverContentRate >= 90) score += 3;
  else if (handoverContentRate >= 70) score += 1;

  if (dailyLogCoverageRate >= 90) score += 4;
  else if (dailyLogCoverageRate >= 70) score += 2;

  if (dailyLogQualityRate >= 80) score += 3;
  else if (dailyLogQualityRate >= 60) score += 1;

  if (significantEventHandoverRate >= 90) score += 4;
  else if (significantEventHandoverRate >= 70) score += 2;

  if (careEventVerificationRate >= 90) score += 3;
  else if (careEventVerificationRate >= 75) score += 1;

  if (notificationReadRate >= 90) score += 3;
  else if (notificationReadRate >= 70) score += 1;

  if (urgentNotificationReadRate >= 100) score += 2;

  if (staffEngagementRate >= 80) score += 2;
  else if (staffEngagementRate >= 50) score += 1;

  // Penalties
  if (handoverCompletionRate < 50) score -= 5;

  if (significantEventHandoverRate < 50) score -= 5;

  if (urgentNotificationReadRate < 70) score -= 5;

  if (dailyLogCoverageRate < 40) score -= 3;

  score = clamp(score, 0, 100);

  const rating = toRating(score);

  // ── Strengths ────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (handoverCompletionRate >= 95) {
    strengths.push(`${handoverCompletionRate}% handover completion — shift communication is consistently documented.`);
  }
  if (handoverContentRate >= 90) {
    strengths.push(`${handoverContentRate}% of handovers contain substantive content — information is being shared, not just ticked off.`);
  }
  if (dailyLogCoverageRate >= 90) {
    strengths.push(`${dailyLogCoverageRate}% daily log coverage — recording reaches every young person.`);
  }
  if (dailyLogQualityRate >= 80) {
    strengths.push(`${dailyLogQualityRate}% of daily logs meet quality threshold — entries are detailed and meaningful.`);
  }
  if (significantEventHandoverRate >= 90 && significantEvents.length > 0) {
    strengths.push(`${significantEventHandoverRate}% of significant events flagged for handover — critical information is being escalated.`);
  }
  if (careEventVerificationRate >= 90 && care_events.length > 0) {
    strengths.push(`${careEventVerificationRate}% care event verification — management oversight of recorded events is strong.`);
  }
  if (notificationReadRate >= 90) {
    strengths.push(`${notificationReadRate}% notification read rate — staff are engaging with system communications.`);
  }
  if (urgentNotificationReadRate === 100 && urgentHighNotifications.length > 0) {
    strengths.push("All urgent and high-priority notifications have been read — critical alerts are not being missed.");
  }
  if (staffEngagementRate >= 80) {
    strengths.push(`${staffEngagementRate}% staff engagement — the majority of the team are actively contributing to the information record.`);
  }

  // ── Concerns ─────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (handoverCompletionRate < 50) {
    concerns.push(`Only ${handoverCompletionRate}% of handovers completed — critical communication gaps between shifts.`);
  } else if (handoverCompletionRate < 80) {
    concerns.push(`${handoverCompletionRate}% handover completion — some shift changes lack documented communication.`);
  }

  if (handoverContentRate < 70 && handovers.length > 0) {
    concerns.push(`Only ${handoverContentRate}% of handovers have substantive content — handovers may be treated as a formality.`);
  }

  if (dailyLogCoverageRate < 40) {
    concerns.push(`Only ${dailyLogCoverageRate}% daily log coverage — most children have no daily recording.`);
  } else if (dailyLogCoverageRate < 70) {
    concerns.push(`${dailyLogCoverageRate}% daily log coverage — some children are not being recorded daily.`);
  }

  if (dailyLogQualityRate < 60 && daily_logs.length > 0) {
    concerns.push(`Only ${dailyLogQualityRate}% of daily logs meet the quality threshold — entries may lack detail.`);
  }

  if (significantEventHandoverRate < 50 && significantEvents.length > 0) {
    concerns.push(`Only ${significantEventHandoverRate}% of significant events flagged for handover — critical information is not reaching the next shift.`);
  }

  if (careEventVerificationRate < 75 && care_events.length > 0) {
    concerns.push(`Only ${careEventVerificationRate}% of care events verified — management oversight of recorded events is insufficient.`);
  }

  if (urgentNotificationReadRate < 70 && urgentHighNotifications.length > 0) {
    concerns.push(`Only ${urgentNotificationReadRate}% of urgent/high notifications read — critical alerts are being missed.`);
  }

  if (notificationReadRate < 70 && notifications.length > 0) {
    concerns.push(`Only ${notificationReadRate}% of notifications read — staff are not engaging with system communications.`);
  }

  if (staffEngagementRate < 50 && total_staff > 0) {
    concerns.push(`Only ${staffEngagementRate}% of staff appear in information records — most of the team are not contributing to the communication record.`);
  }

  // ── Recommendations ──────────────────────────────────────────────
  const recs: InformationFlowQualityResult["recommendations"] = [];
  let rank = 1;

  if (handoverCompletionRate < 80) {
    recs.push({
      rank: rank++,
      recommendation: "Implement a mandatory handover completion check — no staff member should leave site without completing the handover record.",
      urgency: "immediate",
      regulatory_ref: "Reg 13",
    });
  }

  if (significantEventHandoverRate < 70 && significantEvents.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Ensure all significant events are automatically flagged for handover — the system should prompt staff to include significant events in handover notes.",
      urgency: "immediate",
      regulatory_ref: "Reg 36",
    });
  }

  if (urgentNotificationReadRate < 70 && urgentHighNotifications.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Review why urgent notifications are going unread — consider mandatory acknowledgement for urgent and high-priority alerts.",
      urgency: "immediate",
      regulatory_ref: "Reg 13",
    });
  }

  if (dailyLogCoverageRate < 70) {
    recs.push({
      rank: rank++,
      recommendation: "Establish a daily log completion checklist for every child — ensure recording coverage reaches all young people.",
      urgency: "soon",
      regulatory_ref: "Reg 36",
    });
  }

  if (dailyLogQualityRate < 60 && daily_logs.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Provide staff training on meaningful recording — entries should be descriptive, reflective, and at least 50 words.",
      urgency: "soon",
      regulatory_ref: "Reg 36",
    });
  }

  if (careEventVerificationRate < 75 && care_events.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Implement a care event verification workflow — managers should review and verify all recorded care events within 24 hours.",
      urgency: "soon",
      regulatory_ref: "Reg 13",
    });
  }

  if (staffEngagementRate < 50 && total_staff > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Address low staff engagement with information recording — investigate barriers and ensure all staff understand their recording responsibilities.",
      urgency: "planned",
      regulatory_ref: "Reg 13",
    });
  }

  if (notificationReadRate < 70 && notifications.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Review notification delivery — ensure staff have time and access to read system notifications during their shifts.",
      urgency: "planned",
      regulatory_ref: "Reg 13",
    });
  }

  // ── Insights ─────────────────────────────────────────────────────
  const insights: InformationFlowQualityResult["insights"] = [];

  if (
    handoverCompletionRate >= 95 &&
    dailyLogCoverageRate >= 90 &&
    notificationReadRate >= 90 &&
    staffEngagementRate >= 80
  ) {
    insights.push({
      text: `Information flows strongly through this home — ${handoverCompletionRate}% handover completion, ${dailyLogCoverageRate}% daily log coverage, and ${notificationReadRate}% notification engagement. Ofsted will see robust evidence of a well-connected staff team where critical information reaches the right people at the right time.`,
      severity: "positive",
    });
  }

  if (significantEventHandoverRate >= 90 && significantEvents.length > 0 && careEventVerificationRate >= 90) {
    insights.push({
      text: `Significant event communication is exemplary — ${significantEventHandoverRate}% flagged for handover and ${careEventVerificationRate}% of events verified. This demonstrates that the home has effective systems to ensure critical safety information is escalated, communicated, and overseen.`,
      severity: "positive",
    });
  }

  if (handoverCompletionRate < 50) {
    insights.push({
      text: `Fewer than half of handovers are completed. When shift communication breaks down, medication changes, behavioural concerns, and safeguarding information can be lost. This is a leadership failure that Ofsted will identify as a serious risk to children's safety.`,
      severity: "critical",
    });
  }

  if (significantEventHandoverRate < 50 && significantEvents.length > 0) {
    insights.push({
      text: `Only ${significantEventHandoverRate}% of significant events are flagged for handover. This means critical safety information — incidents, safeguarding concerns, health changes — is not systematically reaching the next shift. This is a fundamental communication gap.`,
      severity: "critical",
    });
  }

  if (urgentNotificationReadRate < 70 && urgentHighNotifications.length > 0) {
    insights.push({
      text: `${100 - urgentNotificationReadRate}% of urgent and high-priority notifications are unread. When critical alerts go unacknowledged, safeguarding actions may be delayed and children's safety compromised. Ofsted will question whether the home's communication systems are fit for purpose.`,
      severity: "critical",
    });
  }

  if (dailyLogCoverageRate < 40) {
    insights.push({
      text: `Daily log coverage is only ${dailyLogCoverageRate}% — most children have no daily record. Without consistent daily recording, the home cannot evidence individualised care or demonstrate awareness of each child's day-to-day experience.`,
      severity: "critical",
    });
  }

  if (
    staffEngagementRate < 50 &&
    total_staff > 0 &&
    handoverCompletionRate < 70
  ) {
    insights.push({
      text: `Low staff engagement (${staffEngagementRate}%) combined with poor handover completion (${handoverCompletionRate}%) suggests a systemic communication culture problem. Information is not flowing because staff are not actively participating in the home's communication systems.`,
      severity: "warning",
    });
  }

  if (
    dailyLogQualityRate < 60 &&
    dailyLogCoverageRate >= 70 &&
    daily_logs.length > 0
  ) {
    insights.push({
      text: `Daily log coverage is reasonable at ${dailyLogCoverageRate}%, but quality is low — only ${dailyLogQualityRate}% of entries meet the word count threshold. Logs may be present but lack the detail needed to inform care decisions.`,
      severity: "warning",
    });
  }

  // ── Headline ─────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding information flow — ${handoverCompletionRate}% handover completion, ${dailyLogCoverageRate}% log coverage, and ${notificationReadRate}% notification engagement across the home.`;
  } else if (rating === "good") {
    headline = `Good information flow — communication systems are functioning well with minor gaps in coverage or engagement.`;
  } else if (rating === "adequate") {
    headline = "Adequate information flow — handovers and logs are partially maintained but gaps risk communication breakdowns.";
  } else {
    headline = "Inadequate information flow — significant communication gaps risk children's safety and continuity of care.";
  }

  return {
    flow_rating: rating,
    flow_score: score,
    headline,
    handover_completion_rate: handoverCompletionRate,
    handover_content_rate: handoverContentRate,
    daily_log_coverage_rate: dailyLogCoverageRate,
    daily_log_quality_rate: dailyLogQualityRate,
    significant_event_handover_rate: significantEventHandoverRate,
    care_event_verification_rate: careEventVerificationRate,
    notification_read_rate: notificationReadRate,
    urgent_notification_read_rate: urgentNotificationReadRate,
    information_continuity_score: informationContinuityScore,
    staff_engagement_rate: staffEngagementRate,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Result Helper ─────────────────────────────────────────────────────

function emptyResult(
  rating: InformationFlowRating,
  score: number,
  headline: string,
): InformationFlowQualityResult {
  const isInsufficient = rating === "insufficient_data";
  return {
    flow_rating: rating,
    flow_score: score,
    headline,
    handover_completion_rate: null,
    handover_content_rate: null,
    daily_log_coverage_rate: null,
    daily_log_quality_rate: null,
    significant_event_handover_rate: null,
    care_event_verification_rate: null,
    notification_read_rate: null,
    urgent_notification_read_rate: null,
    information_continuity_score: 0,
    staff_engagement_rate: null,
    strengths: [],
    concerns: isInsufficient
      ? ["No data available to assess information flow quality."]
      : ["No information flow activity recorded — handovers, logs, events, and notifications are all absent despite children being in placement."],
    recommendations: isInsufficient
      ? [{ rank: 1, recommendation: "Begin recording handovers, daily logs, care events, and notifications to establish an information flow baseline.", urgency: "immediate" as const, regulatory_ref: "Reg 13" }]
      : [
          { rank: 1, recommendation: "Immediately establish handover recording at every shift change to ensure continuity of care.", urgency: "immediate" as const, regulatory_ref: "Reg 13" },
          { rank: 2, recommendation: "Implement daily log recording for every child to evidence individualised care and awareness.", urgency: "immediate" as const, regulatory_ref: "Reg 36" },
        ],
    insights: isInsufficient
      ? [{ text: "No children, staff, or activity data available. The engine cannot assess information flow without baseline data.", severity: "warning" as const }]
      : [{ text: "No information flow activity has been recorded despite children being in placement. This represents a total communication failure — Ofsted would identify this as a critical leadership and management concern with direct implications for children's safety.", severity: "critical" as const }],
  };
}
