// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME NOTIFIABLE EVENTS INTELLIGENCE ENGINE
// Home-level: synthesises notifiable events to assess notification compliance,
// follow-up quality, lessons learned, multi-agency reporting, and patterns.
// CHR 2015 Reg 40. SCCIF: "Safe", "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

import { below, formatRate, meets, rateOf } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface NotifiableEventInput {
  id: string;
  date: string;                              // YYYY-MM-DD
  event_type: string;                        // restraint | absconding | allegation_against_staff | police_involvement | serious_incident | etc.
  child_id: string | null;
  ofsted_status: string;                     // notified_within_24h | pending | late | not_required
  has_ofsted_notification: boolean;
  has_la_notification: boolean;
  has_placing_notification: boolean;
  has_follow_up: boolean;
  has_lesson_learned: boolean;
}

export interface HomeNotifiableEventsInput {
  today: string;
  total_children: number;
  child_ids: string[];
  events: NotifiableEventInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type NotifiableEventsRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface EventsProfile {
  total_events_90d: number;
  event_types: Record<string, number>;
  notification_compliance_rate: number | null; // % notified_within_24h; null when no event required notification
  pending_count: number;
  follow_up_rate: number | null;
  lesson_learned_rate: number | null;
  multi_agency_rate: number | null;            // % with all applicable notifications
  children_involved: string[];
  repeat_children: string[];                 // children in 2+ events
}

export interface NotifiableInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface NotifiableRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeNotifiableEventsResult {
  events_rating: NotifiableEventsRating;
  events_score: number;
  headline: string;
  events_profile: EventsProfile;
  strengths: string[];
  concerns: string[];
  recommendations: NotifiableRecommendation[];
  insights: NotifiableInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): NotifiableEventsRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function daysBetween(a: string, b: string): number {
  return Math.abs(
    (new Date(a).getTime() - new Date(b).getTime()) / 86_400_000,
  );
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeNotifiableEvents(
  input: HomeNotifiableEventsInput,
): HomeNotifiableEventsResult {
  const { today, child_ids, events } = input;

  // Filter to 90-day window
  const events90d = events.filter(e => daysBetween(e.date, today) <= 90);

  // An empty register is not a clean 90 days: if nothing has ever been logged
  // Cara cannot tell "no events occurred" from "no events were recorded", and
  // Reg 40 practice cannot be evidenced either way.
  if (events.length === 0) {
    return {
      events_rating: "insufficient_data",
      events_score: 0,
      headline: "No notifiable events have ever been recorded — Reg 40 notification practice cannot be evidenced.",
      events_profile: emptyProfile(),
      strengths: [],
      concerns: ["Nothing on the notifiable events register. Either no event has occurred or none are being logged — neither can be told apart from the record."],
      recommendations: [{ rank: 1, recommendation: "Confirm the notifiable events register is in use and log every Reg 40 event, so that notification timeliness can be evidenced.", urgency: "soon", regulatory_ref: "Reg 40" }],
      insights: [{ text: "Ofsted judges a home on the evidence it can show. An empty notifiable events register evidences nothing about Regulation 40 compliance — it is a gap in the record, not a clean record.", severity: "warning" }],
    };
  }

  // Events are being recorded and none fell in the window — a real position.
  if (events90d.length === 0) {
    return {
      events_rating: "outstanding",
      events_score: 90,
      headline: "No notifiable events in 90 days — excellent safeguarding position.",
      events_profile: emptyProfile(),
      strengths: ["No notifiable events in the past 90 days — evidence of safe, stable care environment."],
      concerns: [],
      recommendations: [],
      insights: [{ text: "Zero notifiable events is an outstanding indicator. This suggests effective risk management and proactive safeguarding practice.", severity: "positive" }],
    };
  }

  // ── Events Profile ────────────────────────────────────────────────────
  const eventTypes: Record<string, number> = {};
  for (const e of events90d) {
    eventTypes[e.event_type] = (eventTypes[e.event_type] || 0) + 1;
  }

  const requiringNotification = events90d.filter(e => e.ofsted_status !== "not_required");
  const notifiedWithin24h = requiringNotification.filter(e => e.ofsted_status === "notified_within_24h").length;
  // Null when every event in the window was "not_required" — nothing was
  // notifiable, which is not the same as everything being notified on time.
  const notificationRate = requiringNotification.length > 0
    ? Math.round((notifiedWithin24h / requiringNotification.length) * 100)
    : null;

  const pending = events90d.filter(e => e.ofsted_status === "pending").length;

  const withFollowUp = events90d.filter(e => e.has_follow_up);
  const followUpRate = rateOf(withFollowUp, events90d);

  const withLesson = events90d.filter(e => e.has_lesson_learned);
  const lessonRate = rateOf(withLesson, events90d);

  // Multi-agency: events that have all applicable notifications
  const withMultiAgency = events90d.filter(e => {
    const hasOfsted = e.has_ofsted_notification || e.ofsted_status === "not_required";
    const hasLA = e.has_la_notification;
    return hasOfsted && hasLA;
  });
  const multiAgencyRate = rateOf(withMultiAgency, events90d);

  const childrenInvolved = [...new Set(events90d.filter(e => e.child_id).map(e => e.child_id as string))];
  const childEventCounts: Record<string, number> = {};
  for (const e of events90d) {
    if (e.child_id) childEventCounts[e.child_id] = (childEventCounts[e.child_id] || 0) + 1;
  }
  const repeatChildren = Object.entries(childEventCounts)
    .filter(([, count]) => count >= 2)
    .map(([id]) => id);

  const profile: EventsProfile = {
    total_events_90d: events90d.length,
    event_types: eventTypes,
    notification_compliance_rate: notificationRate,
    pending_count: pending,
    follow_up_rate: followUpRate,
    lesson_learned_rate: lessonRate,
    multi_agency_rate: multiAgencyRate,
    children_involved: childrenInvolved,
    repeat_children: repeatChildren,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  let score = 55;

  // Event volume (±10)
  if (events90d.length <= 2) score += 5;
  else if (events90d.length <= 5) score += 0;
  else score -= 5;

  // Notification compliance (±12) — nothing notifiable moves the score neither way
  if (notificationRate !== null) {
    if (notificationRate === 100 && pending === 0) score += 8;
    else if (notificationRate >= 80) score += 3;
    else score -= 6;
  }
  if (pending > 0) score -= 3;

  // Follow-up (±8)
  if (followUpRate === 100) score += 5;
  else if (meets(followUpRate, 80)) score += 2;
  else score -= 5;

  // Lessons learned (±6)
  if (lessonRate === 100) score += 4;
  else if (meets(lessonRate, 80)) score += 2;
  else if (below(lessonRate, 50)) score -= 3;

  // Multi-agency (±6)
  if (multiAgencyRate === 100) score += 4;
  else if (meets(multiAgencyRate, 80)) score += 2;
  else score -= 4;

  // Repeat children (±4)
  if (repeatChildren.length === 0) score += 2;
  else if (repeatChildren.length > 1) score -= 2;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (notificationRate === 100 && requiringNotification.length > 0) strengths.push("All notifiable events reported to Ofsted within 24 hours — excellent regulatory compliance.");
  if (followUpRate === 100) strengths.push("Follow-up actions documented for every event — thorough post-incident practice.");
  if (lessonRate === 100) strengths.push("Lessons learned captured for every event — continuous improvement culture.");
  if (multiAgencyRate === 100) strengths.push("Full multi-agency notification for all events — strong partnership working.");
  if (events90d.length <= 2) strengths.push(`Only ${events90d.length} notifiable event${events90d.length === 1 ? "" : "s"} in 90 days — low incident rate.`);
  if (repeatChildren.length === 0 && childrenInvolved.length > 0) strengths.push("No repeat children in notifiable events — events are isolated rather than patterns.");

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (pending > 0) concerns.push(`${pending} event${pending > 1 ? "s" : ""} with pending Ofsted notification — these must be reported within 24 hours.`);
  if (below(notificationRate, 80)) concerns.push(`Only ${notificationRate}% notification compliance — Ofsted expects all events reported within 24 hours.`);
  if (below(followUpRate, 80)) concerns.push(`Follow-up rate is ${followUpRate}% — every event should have documented follow-up actions.`);
  if (below(lessonRate, 50)) concerns.push(`Only ${lessonRate}% of events have lessons learned documented — this is essential for continuous improvement.`);
  if (repeatChildren.length > 0) concerns.push(`${repeatChildren.length} child${repeatChildren.length > 1 ? "ren" : ""} involved in multiple notifiable events — pattern analysis needed.`);
  if (events90d.length > 5) concerns.push(`${events90d.length} notifiable events in 90 days — high volume suggests systemic issues.`);

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: NotifiableRecommendation[] = [];
  let rank = 1;

  if (pending > 0) {
    recs.push({ rank: rank++, recommendation: `Submit ${pending} pending Ofsted notification${pending > 1 ? "s" : ""} immediately — 24-hour deadline applies.`, urgency: "immediate", regulatory_ref: "Reg 40" });
  }
  if (below(notificationRate, 100)) {
    recs.push({ rank: rank++, recommendation: "Review notification procedures to ensure all events are reported within 24 hours.", urgency: "immediate", regulatory_ref: "Reg 40" });
  }
  if (below(followUpRate, 100)) {
    recs.push({ rank: rank++, recommendation: "Complete follow-up documentation for all events — this evidences responsive management.", urgency: "soon", regulatory_ref: "Reg 40" });
  }
  if (repeatChildren.length > 0) {
    recs.push({ rank: rank++, recommendation: `Conduct pattern analysis for ${repeatChildren.length} child${repeatChildren.length > 1 ? "ren" : ""} with repeat events — targeted intervention may be needed.`, urgency: "soon", regulatory_ref: "Reg 12" });
  }
  if (below(lessonRate, 100)) {
    recs.push({ rank: rank++, recommendation: "Ensure lessons learned are captured for every event and shared with the staff team.", urgency: "planned", regulatory_ref: "Reg 40" });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: NotifiableInsight[] = [];

  if (pending > 0) {
    insights.push({ text: `${pending} pending notification${pending > 1 ? "s" : ""}. Ofsted takes non-compliance with Reg 40 very seriously — failure to notify is a regulatory breach.`, severity: "critical" });
  }
  if (events90d.length > 5) {
    insights.push({ text: `${events90d.length} notifiable events in 90 days. Ofsted will examine whether the home is identifying root causes and taking effective action.`, severity: "warning" });
  }
  if (repeatChildren.length > 0) {
    insights.push({ text: `${repeatChildren.length} child${repeatChildren.length > 1 ? "ren" : ""} feature${repeatChildren.length === 1 ? "s" : ""} in multiple events. Ofsted will assess whether the home is responding to patterns and adapting care plans.`, severity: "warning" });
  }
  if (notificationRate === 100 && followUpRate === 100 && requiringNotification.length > 0) {
    insights.push({ text: "Perfect notification compliance with full follow-up documentation. This demonstrates strong governance and regulatory awareness.", severity: "positive" });
  }
  if (lessonRate === 100 && events90d.length > 0) {
    insights.push({ text: "Lessons learned documented for every event. This demonstrates a learning culture — Ofsted views this as evidence of effective leadership.", severity: "positive" });
  }
  if ((eventTypes["restraint"] ?? 0) >= 3) {
    insights.push({ text: `${eventTypes["restraint"]} restraint events in 90 days. Ofsted will scrutinise whether restrictive practice is proportionate and whether de-escalation alternatives are being used.`, severity: "warning" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding event management — ${events90d.length} events with full notification compliance and documented follow-up.`;
  } else if (rating === "good") {
    headline = `Good event management — ${events90d.length} events in 90 days with ${formatRate(notificationRate, "no")} notification compliance.`;
  } else if (rating === "adequate") {
    headline = "Adequate event management — improvements needed in notification timeliness, follow-up, or lessons learned.";
  } else {
    headline = "Event management is inadequate — significant gaps in notification compliance or follow-up documentation.";
  }

  return {
    events_rating: rating,
    events_score: score,
    headline,
    events_profile: profile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Profile ───────────────────────────────────────────────────────────

function emptyProfile(): EventsProfile {
  return {
    total_events_90d: 0, event_types: {},
    notification_compliance_rate: null, pending_count: 0,
    follow_up_rate: null, lesson_learned_rate: null, multi_agency_rate: null,
    children_involved: [], repeat_children: [],
  };
}
