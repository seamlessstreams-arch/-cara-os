// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME NOTIFICATION RESPONSIVENESS INTELLIGENCE ENGINE
// Home-level: aggregates system notifications to assess how responsively the
// home's staff team engages with platform notifications — critical for
// demonstrating that important care events, safeguarding alerts, and management
// oversight items are being acknowledged and acted upon promptly.
// ══════════════════════════════════════════════════════════════════════════════

import { above, below, formatRate, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface NotificationInput {
  id: string;
  home_id: string;
  recipient_id: string;
  title: string;
  type: string; // "system" | "incident" | "safeguarding" | "compliance" | "task" | "general"
  priority: string; // "urgent" | "high" | "normal" | "low"
  read: boolean;
  read_at: string | null; // ISO date
  entity_type: string | null; // "care_event" | "incident" | "task" | "document" | null
  entity_id: string | null;
  created_at: string; // ISO date
}

export interface NotificationResponsivenessInput {
  today: string;
  total_staff: number;
  notifications: NotificationInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type NotificationResponsivenessRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface NotificationResponsivenessResult {
  responsiveness_rating: NotificationResponsivenessRating;
  responsiveness_score: number | null; // 0-100
  headline: string;
  total_notifications: number;
  read_rate: number | null; // % of notifications that have been read
  urgent_read_rate: number | null; // % of urgent/high priority notifications read
  average_response_hours: number | null; // avg hours from created_at to read_at for read notifications
  urgent_response_hours: number | null; // avg hours for urgent/high priority only
  unread_count: number;
  urgent_unread_count: number;
  staff_coverage_rate: number | null; // % of staff who have at least one notification
  notification_type_diversity: number; // distinct types
  oldest_unread_hours: number; // hours since oldest unread notification was created
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: "immediate" | "soon" | "planned"; regulatory_ref?: string }[];
  insights: { text: string; severity: "critical" | "warning" | "positive" }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function hoursBetween(a: string, b: string): number {
  const ms = Math.abs(new Date(b).getTime() - new Date(a).getTime());
  return Math.round((ms / 3_600_000) * 10) / 10;
}

function toRating(score: number): NotificationResponsivenessRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function isUrgentOrHigh(n: NotificationInput): boolean {
  return n.priority === "urgent" || n.priority === "high";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeNotificationResponsiveness(
  input: NotificationResponsivenessInput,
): NotificationResponsivenessResult {
  const { today, total_staff, notifications } = input;

  // ── Special case: no notifications ────────────────────────────────────
  if (notifications.length === 0 && total_staff === 0) {
    return {
      responsiveness_rating: "insufficient_data",
      responsiveness_score: 0,
      headline: "Insufficient data — no staff and no notifications recorded.",
      total_notifications: 0,
      read_rate: 0,
      urgent_read_rate: 0,
      average_response_hours: 0,
      urgent_response_hours: 0,
      unread_count: 0,
      urgent_unread_count: 0,
      staff_coverage_rate: 0,
      notification_type_diversity: 0,
      oldest_unread_hours: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  if (notifications.length === 0 && total_staff > 0) {
    return {
      responsiveness_rating: "good",
      responsiveness_score: 70,
      headline: "No notifications generated — system not yet in active use",
      total_notifications: 0,
      read_rate: 0,
      urgent_read_rate: 0,
      average_response_hours: 0,
      urgent_response_hours: 0,
      unread_count: 0,
      urgent_unread_count: 0,
      staff_coverage_rate: 0,
      notification_type_diversity: 0,
      oldest_unread_hours: 0,
      strengths: [],
      concerns: [],
      recommendations: [
        {
          rank: 1,
          recommendation: "Encourage staff to begin using the platform actively so notification responsiveness can be assessed.",
          urgency: "planned",
        },
      ],
      insights: [
        {
          text: "No notifications have been generated yet. This may indicate the platform is not yet in active use by the staff team.",
          severity: "warning",
        },
      ],
    };
  }

  // ── Core metrics ──────────────────────────────────────────────────────
  const total = notifications.length;
  const readNotifications = notifications.filter((n) => n.read);
  const unreadNotifications = notifications.filter((n) => !n.read);
  const urgentHighNotifications = notifications.filter(isUrgentOrHigh);
  const urgentHighRead = urgentHighNotifications.filter((n) => n.read);
  const urgentHighUnread = urgentHighNotifications.filter((n) => !n.read);

  const readRate = rate(readNotifications.length, total);
  const urgentReadRate = rate(urgentHighRead.length, urgentHighNotifications.length);
  const unreadCount = unreadNotifications.length;
  const urgentUnreadCount = urgentHighUnread.length;

  // ── Response times ────────────────────────────────────────────────────
  const readWithTimes = readNotifications.filter((n) => n.read_at !== null);
  const allResponseHours = readWithTimes.map((n) => hoursBetween(n.created_at, n.read_at!));
  const averageResponseHours =
    allResponseHours.length > 0
      ? Math.round((allResponseHours.reduce((a, b) => a + b, 0) / allResponseHours.length) * 10) / 10
      : null;

  const urgentHighReadWithTimes = urgentHighRead.filter((n) => n.read_at !== null);
  const urgentResponseHoursArr = urgentHighReadWithTimes.map((n) => hoursBetween(n.created_at, n.read_at!));
  const urgentResponseHours =
    urgentResponseHoursArr.length > 0
      ? Math.round((urgentResponseHoursArr.reduce((a, b) => a + b, 0) / urgentResponseHoursArr.length) * 10) / 10
      : null;

  // ── Staff coverage ────────────────────────────────────────────────────
  const distinctRecipients = new Set(notifications.map((n) => n.recipient_id));
  const staffCoverageRate = rate(distinctRecipients.size, total_staff);

  // ── Type diversity ────────────────────────────────────────────────────
  const distinctTypes = new Set(notifications.map((n) => n.type));
  const typeDiversity = distinctTypes.size;

  // ── Oldest unread ─────────────────────────────────────────────────────
  let oldestUnreadHours = 0;
  if (unreadNotifications.length > 0) {
    const unreadHoursArr = unreadNotifications.map((n) => hoursBetween(n.created_at, today));
    oldestUnreadHours = Math.max(...unreadHoursArr);
  }

  // ── Scoring ───────────────────────────────────────────────────────────
  let score = 52;

  // Read rate bonus
  if (meets(readRate, 95)) score += 6;
  else if (meets(readRate, 85)) score += 3;

  // Urgent read rate bonus
  if (meets(urgentReadRate, 100)) score += 6;
  else if (meets(urgentReadRate, 90)) score += 3;

  // Average response hours bonus
  if ((averageResponseHours ?? 0) <= 2) score += 4;
  else if ((averageResponseHours ?? 0) <= 6) score += 2;

  // Urgent response hours bonus
  if ((urgentResponseHours ?? 0) <= 1) score += 4;
  else if ((urgentResponseHours ?? 0) <= 3) score += 2;

  // Unread count bonus
  if (unreadCount === 0) score += 4;

  // Staff coverage bonus
  if (meets(staffCoverageRate, 80)) score += 2;
  else if (meets(staffCoverageRate, 50)) score += 1;

  // Type diversity bonus
  if (typeDiversity >= 4) score += 2;
  else if (typeDiversity >= 2) score += 1;

  // Penalty: urgent unread
  if (urgentUnreadCount > 0) score -= 6;

  // Penalty: oldest unread hours
  if (oldestUnreadHours > 48) score -= 5;
  else if (oldestUnreadHours > 24) score -= 3;

  // Penalty: low read rate
  if (below(readRate, 50)) score -= 5;

  // Penalty: low urgent read rate
  if (below(urgentReadRate, 70)) score -= 5;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (meets(readRate, 95)) strengths.push(`${formatRate(readRate)} of notifications read — staff are highly engaged with the platform.`);
  else if (meets(readRate, 85)) strengths.push(`${formatRate(readRate)} read rate shows good staff engagement with notifications.`);
  if (urgentReadRate === 100 && urgentHighNotifications.length > 0) strengths.push("All urgent and high-priority notifications have been read — safeguarding alerts are being acknowledged.");
  else if (meets(urgentReadRate, 90) && urgentHighNotifications.length > 0) strengths.push(`${formatRate(urgentReadRate)} of urgent/high-priority notifications read — strong responsiveness to critical alerts.`);
  if ((averageResponseHours ?? 0) <= 2 && readWithTimes.length > 0) strengths.push(`Average response time of ${(averageResponseHours ?? 0)} hours — notifications are being actioned promptly.`);
  else if ((averageResponseHours ?? 0) <= 6 && readWithTimes.length > 0) strengths.push(`Average response time of ${(averageResponseHours ?? 0)} hours — reasonable turnaround on notifications.`);
  if ((urgentResponseHours ?? 0) <= 1 && urgentHighReadWithTimes.length > 0) strengths.push(`Urgent notifications responded to in ${(urgentResponseHours ?? 0)} hours on average — excellent prioritisation.`);
  if (unreadCount === 0) strengths.push("Zero unread notifications — all items have been acknowledged.");
  if (meets(staffCoverageRate, 80)) strengths.push(`${formatRate(staffCoverageRate)} staff coverage — the majority of the team are using the platform.`);
  if (typeDiversity >= 4) strengths.push(`Notifications span ${typeDiversity} different types — the platform is being used across care domains.`);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (urgentUnreadCount > 0) concerns.push(`${urgentUnreadCount} urgent/high-priority notification${urgentUnreadCount > 1 ? "s" : ""} unread — these may include safeguarding or incident alerts requiring immediate attention.`);
  if (oldestUnreadHours > 48) concerns.push(`Oldest unread notification is ${oldestUnreadHours} hours old — notifications older than 48 hours suggest items are being missed.`);
  else if (oldestUnreadHours > 24) concerns.push(`Oldest unread notification is ${oldestUnreadHours} hours old — exceeds the 24-hour best-practice threshold.`);
  if (below(readRate, 50)) concerns.push(`Only ${formatRate(readRate)} of notifications have been read — more than half are being ignored or missed.`);
  if (below(urgentReadRate, 70) && urgentHighNotifications.length > 0) concerns.push(`Only ${formatRate(urgentReadRate)} of urgent/high-priority notifications read — critical alerts may be going unacknowledged.`);
  if (below(staffCoverageRate, 50) && total_staff > 0) concerns.push(`Only ${formatRate(staffCoverageRate)} of staff have notifications — limited platform engagement across the team.`);
  if ((averageResponseHours ?? 0) > 24 && readWithTimes.length > 0) concerns.push(`Average response time is ${(averageResponseHours ?? 0)} hours — significantly above the recommended 6-hour threshold.`);
  if ((urgentResponseHours ?? 0) > 6 && urgentHighReadWithTimes.length > 0) concerns.push(`Urgent notification response time averages ${(urgentResponseHours ?? 0)} hours — this should be under 1 hour.`);

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: NotificationResponsivenessResult["recommendations"] = [];
  let rank = 1;

  if (urgentUnreadCount > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Review and action ${urgentUnreadCount} unread urgent/high-priority notification${urgentUnreadCount > 1 ? "s" : ""} immediately — these may relate to safeguarding or incident reporting.`,
      urgency: "immediate",
      regulatory_ref: "Reg 40",
    });
  }
  if (oldestUnreadHours > 48) {
    recs.push({
      rank: rank++,
      recommendation: "Address notifications older than 48 hours — prolonged unread items indicate a gap in oversight.",
      urgency: "immediate",
      regulatory_ref: "Reg 13",
    });
  } else if (oldestUnreadHours > 24) {
    recs.push({
      rank: rank++,
      recommendation: "Clear unread notifications within 24 hours to maintain responsive oversight.",
      urgency: "soon",
      regulatory_ref: "Reg 13",
    });
  }
  if (below(readRate, 50)) {
    recs.push({
      rank: rank++,
      recommendation: "Implement a daily notification review protocol — fewer than half of notifications are being read.",
      urgency: "immediate",
      regulatory_ref: "Reg 13",
    });
  }
  if (below(urgentReadRate, 70) && urgentHighNotifications.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Ensure all urgent and high-priority notifications are acknowledged within 1 hour — these relate to safeguarding and compliance.",
      urgency: "immediate",
      regulatory_ref: "Reg 12",
    });
  }
  if (below(staffCoverageRate, 50) && total_staff > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Increase staff platform adoption — fewer than half the team are receiving notifications.",
      urgency: "soon",
    });
  }
  if ((averageResponseHours ?? 0) > 6 && readWithTimes.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Reduce average response time to under 6 hours by encouraging staff to check notifications at shift start and end.",
      urgency: "soon",
    });
  }
  if (typeDiversity < 2) {
    recs.push({
      rank: rank++,
      recommendation: "Broaden platform usage to generate notifications across care, compliance, and safeguarding domains.",
      urgency: "planned",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: NotificationResponsivenessResult["insights"] = [];

  if (urgentUnreadCount > 0) {
    insights.push({
      text: `${urgentUnreadCount} urgent/high-priority notification${urgentUnreadCount > 1 ? "s remain" : " remains"} unread. Ofsted inspectors will assess whether safeguarding alerts are being acknowledged in a timely manner.`,
      severity: "critical",
    });
  }
  if (oldestUnreadHours > 48) {
    insights.push({
      text: `The oldest unread notification is ${oldestUnreadHours} hours old. Extended unread periods suggest staff may not be checking the system regularly.`,
      severity: "critical",
    });
  } else if (oldestUnreadHours > 24) {
    insights.push({
      text: `The oldest unread notification is ${oldestUnreadHours} hours old. This exceeds the recommended 24-hour acknowledgement window.`,
      severity: "warning",
    });
  }
  if (below(readRate, 50)) {
    insights.push({
      text: `Only ${formatRate(readRate)} of notifications have been read. This indicates a systemic engagement issue that needs leadership attention.`,
      severity: "critical",
    });
  }
  if (meets(readRate, 95) && unreadCount === 0) {
    insights.push({
      text: "All notifications have been read — this demonstrates excellent staff engagement and responsive oversight.",
      severity: "positive",
    });
  } else if (meets(readRate, 95)) {
    insights.push({
      text: `${formatRate(readRate)} read rate demonstrates strong staff engagement with the platform. This is evidence of responsive management practice.`,
      severity: "positive",
    });
  }
  if (urgentReadRate === 100 && urgentHighNotifications.length > 0) {
    insights.push({
      text: "All urgent and high-priority notifications have been acknowledged. This evidences that safeguarding and compliance alerts are being treated with appropriate priority.",
      severity: "positive",
    });
  }
  if ((averageResponseHours ?? 0) <= 2 && readWithTimes.length > 0) {
    insights.push({
      text: `Average response time of ${averageResponseHours} hours is well within best-practice thresholds. Staff are acting on notifications promptly.`,
      severity: "positive",
    });
  }
  if (meets(staffCoverageRate, 80) && total_staff > 1) {
    insights.push({
      text: `${formatRate(staffCoverageRate)} of staff are actively receiving notifications, indicating broad platform adoption across the team.`,
      severity: "positive",
    });
  }
  if (below(staffCoverageRate, 30) && total_staff > 1) {
    insights.push({
      text: `Only ${formatRate(staffCoverageRate)} of staff are receiving notifications. This may indicate that key team members are not using the platform.`,
      severity: "warning",
    });
  }
  if ((urgentResponseHours ?? 0) > 6 && urgentHighReadWithTimes.length > 0) {
    insights.push({
      text: `Urgent notifications are taking an average of ${urgentResponseHours} hours to be read. For safeguarding alerts, this should be under 1 hour.`,
      severity: "warning",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding notification responsiveness — ${formatRate(readRate)} read rate with ${averageResponseHours}h average response time.`;
  } else if (rating === "good") {
    headline = `Good notification responsiveness — ${formatRate(readRate)} read rate across ${total} notifications.`;
  } else if (rating === "adequate") {
    headline = `Adequate notification responsiveness — improvements needed in read rates or response times.`;
  } else {
    headline = `Inadequate notification responsiveness — significant gaps in staff engagement with platform notifications.`;
  }

  return {
    responsiveness_rating: rating,
    responsiveness_score: score,
    headline,
    total_notifications: total,
    read_rate: readRate,
    urgent_read_rate: urgentReadRate,
    average_response_hours: averageResponseHours,
    urgent_response_hours: urgentResponseHours,
    unread_count: unreadCount,
    urgent_unread_count: urgentUnreadCount,
    staff_coverage_rate: staffCoverageRate,
    notification_type_diversity: typeDiversity,
    oldest_unread_hours: oldestUnreadHours,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}
