// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME STATUTORY NOTIFICATION COMPLIANCE INTELLIGENCE ENGINE
// Home-level: assesses statutory notification compliance across timeliness,
// completeness, documentation quality, follow-up, acknowledgement tracking,
// and regulatory accuracy. CHR 2015 Reg 40/41, Schedule 5, SCCIF: "Safe",
// "Well-led and managed."
// Pure deterministic engine — no imports, no LLM, no external deps.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface NotificationRecordInput {
  id: string;
  date: string;                      // ISO date YYYY-MM-DD
  notified_to: string;               // "Ofsted" | "Local Authority" | "Police" | "DBS"
  notification_type: string;         // "Serious incident" | "Missing child" | "Safeguarding" | "Death" | "Illness"
  regulation: string;                // e.g. "Reg 40(4)(a)"
  within_timeframe: boolean;
  acknowledgement_received: boolean;
  has_event_summary: boolean;        // event_summary non-empty
  has_linked_event: boolean;         // linked_event non-empty
}

export interface NotifiableEventRecordInput {
  id: string;
  date: string;
  event_type: string;
  severity: string;                  // "critical" | "serious" | "moderate"
  notification_required: boolean;
  notification_sent: boolean;
  follow_up_required: boolean;
  follow_up_completed: boolean;
}

export interface StatutoryNotificationComplianceInput {
  today: string;
  total_children: number;
  notifications: NotificationRecordInput[];
  notifiable_events: NotifiableEventRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type StatutoryNotificationRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface NotificationInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface NotificationRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface StatutoryNotificationComplianceResult {
  notification_rating: StatutoryNotificationRating;
  notification_score: number;
  headline: string;
  total_notifications: number;
  total_notifiable_events: number;
  timeliness_rate: number;
  completeness_rate: number;
  documentation_rate: number;
  follow_up_rate: number;
  acknowledgement_rate: number;
  missed_notifications: number;
  strengths: string[];
  concerns: string[];
  recommendations: NotificationRecommendation[];
  insights: NotificationInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 86_400_000,
  );
}

function toRating(score: number): StatutoryNotificationRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// Known statutory notification recipients for regulatory accuracy
const KNOWN_RECIPIENTS: Record<string, string[]> = {
  "Serious incident": ["Ofsted", "Local Authority"],
  "Missing child": ["Ofsted", "Police", "Local Authority"],
  "Safeguarding": ["Ofsted", "Local Authority"],
  "Death": ["Ofsted", "Local Authority", "Police"],
  "Illness": ["Ofsted"],
};

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeStatutoryNotificationCompliance(
  input: StatutoryNotificationComplianceInput,
): StatutoryNotificationComplianceResult {
  const { today, total_children, notifications, notifiable_events } = input;

  // ── Special case: no children ────────────────────────────────────────
  if (total_children === 0) {
    return {
      notification_rating: "insufficient_data",
      notification_score: 0,
      headline: "No children in placement — statutory notification compliance cannot be assessed.",
      total_notifications: 0,
      total_notifiable_events: 0,
      timeliness_rate: 0,
      completeness_rate: 0,
      documentation_rate: 0,
      follow_up_rate: 0,
      acknowledgement_rate: 0,
      missed_notifications: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Filter to last 365 days ──────────────────────────────────────────
  const recentNotifications = notifications.filter(
    (n) => daysBetween(n.date, today) <= 365,
  );
  const recentEvents = notifiable_events.filter(
    (e) => daysBetween(e.date, today) <= 365,
  );

  // ── Special case: no notifications AND no notifiable events ──────────
  if (recentNotifications.length === 0 && recentEvents.length === 0) {
    return {
      notification_rating: "outstanding",
      notification_score: 85,
      headline: "No notifiable events or statutory notifications required — stable, safe environment.",
      total_notifications: 0,
      total_notifiable_events: 0,
      timeliness_rate: 0,
      completeness_rate: 0,
      documentation_rate: 0,
      follow_up_rate: 0,
      acknowledgement_rate: 0,
      missed_notifications: 0,
      strengths: [
        "No notifiable events in the review period — evidence of a safe, well-managed home.",
      ],
      concerns: [],
      recommendations: [],
      insights: [
        {
          text: "Zero notifiable events and no statutory notifications required. This indicates effective safeguarding, risk management, and stable care provision.",
          severity: "positive",
        },
      ],
    };
  }

  // ── Compute rates ────────────────────────────────────────────────────

  // Timeliness: within_timeframe rate for notifications
  const timelyCount = recentNotifications.filter((n) => n.within_timeframe).length;
  const timelinessRate = pct(timelyCount, recentNotifications.length);

  // Completeness: notification_sent for all required notifiable events
  const requiredEvents = recentEvents.filter((e) => e.notification_required);
  const sentCount = requiredEvents.filter((e) => e.notification_sent).length;
  const completenessRate = pct(sentCount, requiredEvents.length);

  // Documentation quality: has_event_summary AND has_linked_event
  const documentedCount = recentNotifications.filter(
    (n) => n.has_event_summary && n.has_linked_event,
  ).length;
  const documentationRate = pct(documentedCount, recentNotifications.length);

  // Follow-up compliance: follow_up_completed for all follow_up_required events
  const followUpRequired = recentEvents.filter((e) => e.follow_up_required);
  const followUpCompleted = followUpRequired.filter((e) => e.follow_up_completed).length;
  const followUpRate = pct(followUpCompleted, followUpRequired.length);

  // Acknowledgement tracking
  const ackedCount = recentNotifications.filter((n) => n.acknowledgement_received).length;
  const acknowledgementRate = pct(ackedCount, recentNotifications.length);

  // Missed notifications: events that required notification but none sent
  const missedNotifications = requiredEvents.filter((e) => !e.notification_sent).length;

  // ── Scoring: base 52 + 6 modifiers ──────────────────────────────────
  let score = 52;

  // Modifier 1: Notification timeliness
  if (recentNotifications.length === 0) {
    score += 0;
  } else if (timelinessRate === 100) {
    score += 6;
  } else if (timelinessRate >= 90) {
    score += 3;
  } else if (timelinessRate < 50) {
    score += -5 + -3; // <70% penalty + <50% extra penalty
  } else if (timelinessRate < 70) {
    score -= 5;
  } else {
    score += 0; // 70-89% — no bonus, no penalty
  }

  // Modifier 2: Notification completeness
  if (recentEvents.length === 0) {
    score -= 1;
  } else if (requiredEvents.length === 0) {
    score += 1;
  } else if (completenessRate === 100) {
    score += 5;
  } else if (completenessRate >= 90) {
    score += 2;
  } else if (completenessRate < 70) {
    score -= 5;
  } else {
    score += 0; // 70-89% — neutral
  }

  // Modifier 3: Documentation quality
  if (recentNotifications.length === 0) {
    score -= 1;
  } else if (documentationRate >= 95) {
    score += 5;
  } else if (documentationRate >= 80) {
    score += 2;
  } else if (documentationRate < 60) {
    score -= 4;
  } else {
    score += 0; // 60-79% — neutral
  }

  // Modifier 4: Follow-up compliance
  if (recentEvents.length === 0) {
    score -= 1;
  } else if (followUpRequired.length === 0) {
    score += 1;
  } else if (followUpRate === 100) {
    score += 5;
  } else if (followUpRate >= 80) {
    score += 2;
  } else if (followUpRate < 60) {
    score -= 4;
  } else {
    score += 0; // 60-79% — neutral
  }

  // Modifier 5: Acknowledgement tracking
  if (recentNotifications.length === 0) {
    score -= 1;
  } else if (acknowledgementRate >= 90) {
    score += 4;
  } else if (acknowledgementRate >= 70) {
    score += 2;
  } else if (acknowledgementRate < 50) {
    score -= 4;
  } else {
    score += 0; // 50-69% — neutral
  }

  // Modifier 6: Regulatory accuracy
  if (recentNotifications.length === 0) {
    score -= 2;
  } else {
    // Check regulation field present and recipient matching
    const withRegulation = recentNotifications.filter(
      (n) => n.regulation && n.regulation.trim().length > 0,
    ).length;
    const regulationRate = pct(withRegulation, recentNotifications.length);

    // Check recipient matching against known statutory recipients
    let correctRecipientCount = 0;
    for (const n of recentNotifications) {
      const expectedRecipients = KNOWN_RECIPIENTS[n.notification_type];
      if (expectedRecipients && expectedRecipients.includes(n.notified_to)) {
        correctRecipientCount++;
      }
    }
    const recipientRate = pct(correctRecipientCount, recentNotifications.length);

    const combinedRegulatoryRate = Math.round((regulationRate + recipientRate) / 2);

    if (combinedRegulatoryRate >= 90) {
      score += 5;
    } else if (combinedRegulatoryRate >= 60) {
      score += 2;
    } else {
      score -= 3;
    }
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (timelinessRate === 100 && recentNotifications.length > 0) {
    strengths.push(
      "All statutory notifications submitted within required timeframes — excellent regulatory compliance.",
    );
  }
  if (completenessRate === 100 && requiredEvents.length > 0) {
    strengths.push(
      "Every notifiable event requiring notification has been reported — no missed statutory duties.",
    );
  }
  if (documentationRate >= 95 && recentNotifications.length > 0) {
    strengths.push(
      "Notification documentation is thorough — event summaries and linked events consistently recorded.",
    );
  }
  if (followUpRate === 100 && followUpRequired.length > 0) {
    strengths.push(
      "All follow-up actions completed for events requiring them — responsive post-event management.",
    );
  }
  if (acknowledgementRate >= 90 && recentNotifications.length > 0) {
    strengths.push(
      "High rate of acknowledgement tracking — evidence of effective communication with statutory bodies.",
    );
  }
  if (missedNotifications === 0 && requiredEvents.length > 0) {
    strengths.push(
      "No missed notifications for required events — statutory notification duties consistently met.",
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (timelinessRate < 70 && recentNotifications.length > 0) {
    concerns.push(
      `Only ${timelinessRate}% of notifications submitted within required timeframes — regulatory breach risk.`,
    );
  }
  if (missedNotifications > 0) {
    concerns.push(
      `${missedNotifications} notifiable event${missedNotifications > 1 ? "s" : ""} required notification but none was sent — statutory duty not met.`,
    );
  }
  if (documentationRate < 60 && recentNotifications.length > 0) {
    concerns.push(
      `Documentation quality at ${documentationRate}% — event summaries or linked events missing from notifications.`,
    );
  }
  if (followUpRate < 60 && followUpRequired.length > 0) {
    concerns.push(
      `Only ${followUpRate}% of required follow-ups completed — events without closure increase risk.`,
    );
  }
  if (acknowledgementRate < 50 && recentNotifications.length > 0) {
    concerns.push(
      `Only ${acknowledgementRate}% of notifications have acknowledgement received — unclear if statutory bodies are aware.`,
    );
  }
  if (recentEvents.filter((e) => e.severity === "critical").length > 0 && missedNotifications > 0) {
    concerns.push(
      "Critical severity events with missed notifications — immediate regulatory action required.",
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: NotificationRecommendation[] = [];
  let rank = 1;

  if (missedNotifications > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Submit ${missedNotifications} outstanding notification${missedNotifications > 1 ? "s" : ""} for notifiable events immediately — statutory duty applies.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 40",
    });
  }
  if (timelinessRate < 100 && recentNotifications.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Review notification procedures to ensure all statutory notifications are submitted within required timeframes.",
      urgency: timelinessRate < 70 ? "immediate" : "soon",
      regulatory_ref: "CHR 2015 Reg 40",
    });
  }
  if (followUpRate < 100 && followUpRequired.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Complete all outstanding follow-up actions for notifiable events to evidence responsive management.",
      urgency: followUpRate < 60 ? "immediate" : "soon",
      regulatory_ref: "CHR 2015 Reg 40",
    });
  }
  if (documentationRate < 80 && recentNotifications.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Improve notification documentation — ensure every notification has an event summary and is linked to the originating event.",
      urgency: "soon",
      regulatory_ref: "Schedule 5 CHR 2015",
    });
  }
  if (acknowledgementRate < 70 && recentNotifications.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Establish acknowledgement tracking process — follow up with statutory bodies to confirm receipt of all notifications.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 40",
    });
  }
  if (rating === "inadequate") {
    recs.push({
      rank: rank++,
      recommendation: "Develop a statutory notification improvement plan and brief all staff on notification duties under Reg 40.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 40/41",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: NotificationInsight[] = [];

  if (missedNotifications > 0) {
    insights.push({
      text: `${missedNotifications} notifiable event${missedNotifications > 1 ? "s" : ""} without statutory notification. Failure to notify under Reg 40 is a regulatory breach that Ofsted will treat seriously.`,
      severity: "critical",
    });
  }
  if (timelinessRate < 50 && recentNotifications.length > 0) {
    insights.push({
      text: `Less than half of notifications were submitted on time. Ofsted will view persistent late notification as evidence of poor leadership and governance.`,
      severity: "critical",
    });
  }
  if (recentEvents.filter((e) => e.severity === "critical" && !e.notification_sent && e.notification_required).length > 0) {
    insights.push({
      text: "Critical severity events have not been notified. Reg 41 requires immediate notification of the most serious events — this is a significant regulatory failing.",
      severity: "critical",
    });
  }
  if (timelinessRate === 100 && completenessRate === 100 && recentNotifications.length > 0 && requiredEvents.length > 0) {
    insights.push({
      text: "Perfect notification timeliness and completeness. This demonstrates robust statutory notification systems and strong regulatory awareness.",
      severity: "positive",
    });
  }
  if (followUpRate === 100 && followUpRequired.length > 0) {
    insights.push({
      text: "All required follow-ups completed — evidence of a responsive management culture that learns from events.",
      severity: "positive",
    });
  }
  if (documentationRate >= 95 && recentNotifications.length > 0) {
    insights.push({
      text: "Notification documentation is consistently thorough. Ofsted will view this as evidence of effective record-keeping and governance.",
      severity: "positive",
    });
  }
  if (acknowledgementRate < 50 && recentNotifications.length > 0) {
    insights.push({
      text: "Low acknowledgement rates may indicate notifications are not reaching the intended recipients — this undermines the purpose of statutory notification.",
      severity: "warning",
    });
  }
  if (recentEvents.filter((e) => e.severity === "critical").length >= 3) {
    insights.push({
      text: `${recentEvents.filter((e) => e.severity === "critical").length} critical severity events in the review period. Ofsted will scrutinise whether the home is identifying systemic causes and taking effective preventive action.`,
      severity: "warning",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding statutory notification compliance — ${recentNotifications.length} notification${recentNotifications.length !== 1 ? "s" : ""} with ${timelinessRate}% timeliness and ${missedNotifications === 0 ? "no" : missedNotifications} missed.`;
  } else if (rating === "good") {
    headline = `Good statutory notification compliance — minor gaps in ${timelinessRate < 100 ? "timeliness" : "documentation or follow-up"}.`;
  } else if (rating === "adequate") {
    headline = `Adequate statutory notification compliance — improvements needed in timeliness, completeness, or follow-up.`;
  } else {
    headline = `Statutory notification compliance is inadequate — ${missedNotifications} missed notification${missedNotifications !== 1 ? "s" : ""} and significant process gaps.`;
  }

  return {
    notification_rating: rating,
    notification_score: score,
    headline,
    total_notifications: recentNotifications.length,
    total_notifiable_events: recentEvents.length,
    timeliness_rate: timelinessRate,
    completeness_rate: completenessRate,
    documentation_rate: documentationRate,
    follow_up_rate: followUpRate,
    acknowledgement_rate: acknowledgementRate,
    missed_notifications: missedNotifications,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}
