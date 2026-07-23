// ══════════════════════════════════════════════════════════════════════════════
// CARA — NOTIFIABLE EVENTS INTELLIGENCE ENGINE
// Pure deterministic engine for Reg 40 notifiable events analysis.
// Analyses notification compliance, event distribution, per-child frequency,
// and generates Cara intelligence insights.
// ══════════════════════════════════════════════════════════════════════════════

import { below, formatRate, meets, rate } from "@/lib/metrics/rate";

export interface NotifiableEventInput {
  id: string;
  date: string;
  event_type: string;
  child_id: string | null;
  summary: string;
  reported_by: string;
  ofsted_status: string;
  ofsted_notified_date: string | null;
  la_notified_date: string | null;
  placing_notified_date: string | null;
  follow_up: string;
  lesson_learned: string;
}

export interface ChildRef {
  id: string;
  name: string;
}

export interface StaffRef {
  id: string;
  name: string;
}

export interface NotifiableEventsOverview {
  total_events: number;
  notified_within_24h: number;
  notified_late: number;
  pending: number;
  compliance_rate: number | null;  // null = no notifiable events recorded, so nothing to notify
  events_last_30_days: number;
  events_last_90_days: number;
  unique_children_involved: number;
  unique_staff_reporting: number;
}

export interface EventTypeBreakdown {
  event_type: string;
  type_label: string;
  count: number;
  pct: number;
}

export interface ChildEventProfile {
  child_id: string;
  child_name: string;
  total_events: number;
  event_types: string[];
  most_recent_date: string;
  pending_notifications: number;
  risk_flags: string[];
}

export interface NotifiableEventAlert {
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface CaraNotifiableInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface NotifiableEventsIntelligenceResult {
  overview: NotifiableEventsOverview;
  event_types: EventTypeBreakdown[];
  child_profiles: ChildEventProfile[];
  recent_events: RecentEvent[];
  alerts: NotifiableEventAlert[];
  insights: CaraNotifiableInsight[];
}

export interface RecentEvent {
  id: string;
  date: string;
  event_type: string;
  type_label: string;
  child_name: string | null;
  ofsted_status: string;
  summary: string;
}

interface EngineInput {
  events: NotifiableEventInput[];
  children: ChildRef[];
  staff: StaffRef[];
  today?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z");
  const db = new Date(b + "T00:00:00Z");
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

const TYPE_LABELS: Record<string, string> = {
  death: "Death",
  serious_illness: "Serious Illness",
  serious_injury: "Serious Injury",
  serious_incident: "Serious Incident",
  child_protection: "Child Protection",
  police_involvement: "Police Involvement",
  absconding: "Absconding",
  allegation_against_staff: "Allegation Against Staff",
  restraint: "Restraint",
  exclusion_from_school: "School Exclusion",
  fire: "Fire",
  outbreak: "Outbreak",
  significant_complaint: "Significant Complaint",
  ofsted_referral: "Ofsted Referral",
};

function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeNotifiableEventsIntelligence(input: EngineInput): NotifiableEventsIntelligenceResult {
  const { events, children, staff, today = new Date().toISOString().slice(0, 10) } = input;

  if (events.length === 0) {
    return {
      overview: {
        total_events: 0,
        notified_within_24h: 0,
        notified_late: 0,
        pending: 0,
        compliance_rate: null,
        events_last_30_days: 0,
        events_last_90_days: 0,
        unique_children_involved: 0,
        unique_staff_reporting: 0,
      },
      event_types: [],
      child_profiles: [],
      recent_events: [],
      alerts: [],
      insights: [],
    };
  }

  const childMap = new Map(children.map((c) => [c.id, c.name]));
  const staffMap = new Map(staff.map((s) => [s.id, s.name]));

  // ── Overview ────────────────────────────────────────────────────────────
  const notifiedWithin24h = events.filter((e) => e.ofsted_status === "notified_within_24h").length;
  const notifiedLate = events.filter((e) => e.ofsted_status === "notified_late").length;
  const pending = events.filter((e) => e.ofsted_status === "pending").length;
  const completed = notifiedWithin24h + notifiedLate;
  const complianceRate = rate(notifiedWithin24h, events.length);

  const eventsLast30 = events.filter((e) => daysBetween(e.date, today) >= 0 && daysBetween(e.date, today) <= 30).length;
  const eventsLast90 = events.filter((e) => daysBetween(e.date, today) >= 0 && daysBetween(e.date, today) <= 90).length;

  const uniqueChildren = new Set(events.filter((e) => e.child_id).map((e) => e.child_id!));
  const uniqueStaff = new Set(events.map((e) => e.reported_by));

  const overview: NotifiableEventsOverview = {
    total_events: events.length,
    notified_within_24h: notifiedWithin24h,
    notified_late: notifiedLate,
    pending,
    compliance_rate: complianceRate,
    events_last_30_days: eventsLast30,
    events_last_90_days: eventsLast90,
    unique_children_involved: uniqueChildren.size,
    unique_staff_reporting: uniqueStaff.size,
  };

  // ── Event type breakdown ────────────────────────────────────────────────
  const typeCounts = new Map<string, number>();
  for (const e of events) {
    typeCounts.set(e.event_type, (typeCounts.get(e.event_type) ?? 0) + 1);
  }
  const event_types: EventTypeBreakdown[] = [...typeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({
      event_type: type,
      type_label: typeLabel(type),
      count,
      pct: Math.round((count / events.length) * 100),
    }));

  // ── Child profiles ──────────────────────────────────────────────────────
  const childEvents = new Map<string, NotifiableEventInput[]>();
  for (const e of events) {
    if (!e.child_id) continue;
    const arr = childEvents.get(e.child_id) ?? [];
    arr.push(e);
    childEvents.set(e.child_id, arr);
  }

  const child_profiles: ChildEventProfile[] = [...childEvents.entries()]
    .map(([childId, evts]) => {
      const sorted = [...evts].sort((a, b) => b.date.localeCompare(a.date));
      const types = [...new Set(evts.map((e) => e.event_type))];
      const pendingCount = evts.filter((e) => e.ofsted_status === "pending").length;

      const risk_flags: string[] = [];
      if (evts.length >= 3) risk_flags.push("repeat_involvement");
      if (pendingCount > 0) risk_flags.push("pending_notification");
      if (types.includes("restraint") && evts.filter((e) => e.event_type === "restraint").length >= 2) {
        risk_flags.push("repeat_restraint");
      }
      if (types.length >= 3) risk_flags.push("multiple_event_types");
      const last30Events = evts.filter((e) => daysBetween(e.date, today) >= 0 && daysBetween(e.date, today) <= 30);
      if (last30Events.length >= 2) risk_flags.push("frequent_recent");

      return {
        child_id: childId,
        child_name: childMap.get(childId) ?? childId,
        total_events: evts.length,
        event_types: types,
        most_recent_date: sorted[0].date,
        pending_notifications: pendingCount,
        risk_flags,
      };
    })
    .sort((a, b) => b.total_events - a.total_events);

  // ── Recent events ───────────────────────────────────────────────────────
  const recent_events: RecentEvent[] = [...events]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6)
    .map((e) => ({
      id: e.id,
      date: e.date,
      event_type: e.event_type,
      type_label: typeLabel(e.event_type),
      child_name: e.child_id ? (childMap.get(e.child_id) ?? null) : null,
      ofsted_status: e.ofsted_status,
      summary: e.summary,
    }));

  // ── Alerts ──────────────────────────────────────────────────────────────
  const alerts: NotifiableEventAlert[] = [];

  // Critical: pending notifications older than 24h
  const pendingEvents = events.filter((e) => e.ofsted_status === "pending");
  for (const e of pendingEvents) {
    const daysOld = daysBetween(e.date, today);
    if (daysOld >= 1) {
      alerts.push({
        type: "overdue_notification",
        severity: "critical",
        message: `${typeLabel(e.event_type)} (${e.date}) — Ofsted notification pending. ${daysOld} day${daysOld > 1 ? "s" : ""} since event. 24-hour deadline breached. Notify immediately and document delay reason.`,
      });
    }
  }

  // High: late notifications
  const lateEvents = events.filter((e) => e.ofsted_status === "notified_late");
  for (const e of lateEvents) {
    alerts.push({
      type: "late_notification",
      severity: "high",
      message: `${typeLabel(e.event_type)} (${e.date}) — notification sent late. Review processes to prevent recurrence.`,
    });
  }

  // Medium: repeat child involvement
  for (const profile of child_profiles) {
    if (profile.total_events >= 3) {
      alerts.push({
        type: "repeat_child",
        severity: "medium",
        message: `${profile.child_name} involved in ${profile.total_events} notifiable events. Review care plan and consider multi-agency strategy meeting.`,
      });
    }
  }

  // Low: events without follow-up or lesson learned
  const noFollowUp = events.filter((e) => !e.follow_up && !e.lesson_learned);
  if (noFollowUp.length > 0) {
    alerts.push({
      type: "incomplete_learning",
      severity: "low",
      message: `${noFollowUp.length} event${noFollowUp.length > 1 ? "s" : ""} without follow-up actions or lessons learned recorded. Complete for Reg 40 compliance.`,
    });
  }

  // ── Cara Insights ──────────────────────────────────────────────────────
  const insights: CaraNotifiableInsight[] = [];

  // Critical: pending notifications
  if (pending > 0) {
    insights.push({
      severity: "critical",
      text: `${pending} Ofsted notification${pending > 1 ? "s" : ""} pending — regulatory breach of 24-hour deadline. Immediate action required to notify Ofsted and document reasons for delay.`,
    });
  }

  // Warning: late notifications pattern
  if (notifiedLate > 0) {
    insights.push({
      severity: "warning",
      text: `${notifiedLate} notification${notifiedLate > 1 ? "s were" : " was"} sent late. Review notification procedures to ensure Reg 40 compliance within 24-hour window.`,
    });
  }

  // Warning: repeat child
  const repeatChildren = child_profiles.filter((p) => p.total_events >= 3);
  if (repeatChildren.length > 0) {
    for (const child of repeatChildren) {
      insights.push({
        severity: "warning",
        text: `${child.child_name} involved in ${child.total_events} notifiable events (${child.event_types.map(typeLabel).join(", ")}). Pattern indicates escalating risk — recommend multi-agency strategy review.`,
      });
    }
  }

  // Warning: high frequency in last 30 days
  if (eventsLast30 >= 3) {
    insights.push({
      severity: "warning",
      text: `${eventsLast30} notifiable events in the last 30 days indicates elevated risk period. Review staffing levels and care strategies.`,
    });
  }

  // Positive: 100% compliance
  if (meets(complianceRate, 100)) {
    insights.push({
      severity: "positive",
      text: `100% Ofsted notification compliance — all ${events.length} events notified within 24 hours. Reg 40 fully met.`,
    });
  }

  // Positive: high compliance (>=80% but not 100%)
  if (meets(complianceRate, 80) && below(complianceRate, 100)) {
    insights.push({
      severity: "positive",
      text: `${formatRate(complianceRate)} notification compliance rate. ${notifiedWithin24h} of ${events.length} events notified within 24 hours. Reg 40 requirements broadly met.`,
    });
  }

  // Positive: all events have follow-up and lessons learned
  const withLearning = events.filter((e) => e.follow_up && e.lesson_learned);
  if (withLearning.length === events.length && events.length > 0) {
    insights.push({
      severity: "positive",
      text: `All ${events.length} events have follow-up actions and lessons learned documented. Demonstrates reflective practice and organisational learning.`,
    });
  }

  // Positive: multiple staff reporting
  if (uniqueStaff.size >= 3) {
    insights.push({
      severity: "positive",
      text: `${uniqueStaff.size} different staff members have reported notifiable events, indicating shared responsibility and culture of transparency.`,
    });
  }

  // Positive: diverse notification methods (Ofsted, LA, placing all covered)
  const allThreeNotified = events.filter(
    (e) => e.ofsted_notified_date && e.la_notified_date && e.placing_notified_date
  );
  if (allThreeNotified.length >= 3) {
    insights.push({
      severity: "positive",
      text: `${allThreeNotified.length} events have complete tri-party notification (Ofsted, Local Authority, and Placing Authority). Multi-agency communication is robust.`,
    });
  }

  return {
    overview,
    event_types,
    child_profiles,
    recent_events,
    alerts,
    insights,
  };
}
