// ══════════════════════════════════════════════════════════════════════════════
// CARA — Cara MANAGER OVERSIGHT ENGINE (pure / deterministic)
//
// Slice C of the Practice Assistant: derives manager ALERTS from incident
// sessions (missing record / child voice / restorative follow-up / manager
// notification, AI-assisted records awaiting approval, possible Regulation 40
// consideration) and recognises PATTERNS (family-contact-linked incidents,
// bedtime dysregulation, rising frequency, missing child voice, recording-
// quality themes, same staff–child pairings).
//
// Alerts are LIVE-DERIVED from the data — they disappear by DOING the practice
// (recording the voice, completing the restorative), not by ticking them away.
// A manager may still resolve/dismiss with their judgement; that state is kept
// and applied here. Patterns are deterministic and explainable: every insight
// names its evidence. Reg 40 wording is always "consider" — never a decision.
// ══════════════════════════════════════════════════════════════════════════════

import type { IncidentSession, IncidentTimelineEntry, CaraRecordingReview } from "./cara-incident-engine";
import { INCIDENT_TYPES, REG40_WORDING } from "./cara-incident-engine";
import type { RestorativeConversationRecord, PostIncidentReflectionRecord } from "./post-incident-engine";

export const OVERSIGHT_DISCLAIMER =
  "Alerts clear when the practice happens — they are prompts for support and oversight, not performance judgements. Regulation 40 items are for the manager to consider; Cara never decides.";

export type AlertPriority = "urgent" | "high" | "medium" | "low";
export type AlertStatus = "open" | "resolved" | "dismissed";

export interface ManagerAlert {
  key: string;                    // deterministic — stable across recomputes
  alert_type: string;
  priority: AlertPriority;
  title: string;
  description: string;
  child_id: string | null;
  incident_session_id: string | null;
  review_id?: string | null;
  status: AlertStatus;
}

export interface AlertStateRecord {
  id: string;                     // = alert key
  status: AlertStatus;
  resolved_by_user_id: string | null;
  resolved_at: string | null;
}

export interface PatternInsight {
  key: string;
  kind: string;
  severity: "info" | "watch" | "attention";
  title: string;
  insight: string;                // spec-style manager sentence, evidence included
  child_id: string | null;
  count: number;
  suggestion: string;
}

const REG40_TYPES = new Set(["physical_intervention", "missing_from_home", "safeguarding_concern", "police_involvement", "self_harm_concern"]);
const PRIORITY_RANK: Record<AlertPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

function iso(d: string | null | undefined): string | null {
  if (!d) return null;
  const s = String(d).trim();
  return s ? s.slice(0, 10) : null;
}
function daysAgo(date: string, today: string): number {
  const [ay, am, ad] = today.split("-").map(Number);
  const [by, bm, bd] = date.split("-").map(Number);
  return Math.round((Date.UTC(ay, (am || 1) - 1, ad || 1) - Date.UTC(by, (bm || 1) - 1, bd || 1)) / 86_400_000);
}
const typeLabel = (key: string) => INCIDENT_TYPES.find((t) => t.key === key)?.label ?? key;

export interface OversightInput {
  sessions: IncidentSession[];
  entries: IncidentTimelineEntry[];
  reviews: CaraRecordingReview[];
  restoratives: RestorativeConversationRecord[];
  reflections: PostIncidentReflectionRecord[];
  alertStates: AlertStateRecord[];
  today: string;
}

// ── Alerts ──────────────────────────────────────────────────────────────────────
export function deriveManagerAlerts(input: OversightInput): ManagerAlert[] {
  const { sessions, entries, reviews, restoratives, alertStates } = input;
  const stateByKey = new Map(alertStates.map((s) => [s.id, s.status]));
  const entriesBySession = new Map<string, IncidentTimelineEntry[]>();
  for (const e of entries) {
    const list = entriesBySession.get(e.incident_session_id) ?? [];
    list.push(e);
    entriesBySession.set(e.incident_session_id, list);
  }
  const restorativeSessions = new Set(restoratives.map((r) => r.incident_session_id));

  const alerts: ManagerAlert[] = [];
  const push = (a: Omit<ManagerAlert, "status">) =>
    alerts.push({ ...a, status: (stateByKey.get(a.key) ?? "open") as AlertStatus });

  for (const s of sessions) {
    if (s.incident_status === "active") continue; // live incidents are on the live board, not oversight
    const ses = entriesBySession.get(s.id) ?? [];
    const has = (type: string) => ses.some((e) => e.entry_type === type && e.raw_text.trim());
    const label = typeLabel(s.incident_type);

    if (!s.final_record_created) {
      push({ key: `missing_record:${s.id}`, alert_type: "missing_manager_review", priority: "high", title: "Incident record not completed", description: `${label} — the incident ended but no final record has been accepted yet.`, child_id: s.child_id, incident_session_id: s.id });
    }
    if (!has("child_voice")) {
      push({ key: `missing_child_voice:${s.id}`, alert_type: "missing_child_voice", priority: "medium", title: "Child's voice not captured", description: `${label} — capture the child's voice when settled, or record that they declined and how this was respected.`, child_id: s.child_id, incident_session_id: s.id });
    }
    if (!restorativeSessions.has(s.id) && !has("restorative_action")) {
      push({ key: `missing_debrief:${s.id}`, alert_type: "missing_debrief", priority: "medium", title: "No restorative follow-up recorded", description: `${label} — no restorative conversation or follow-up is recorded for this incident.`, child_id: s.child_id, incident_session_id: s.id });
    }
    if (!s.manager_notified && !has("manager_notification")) {
      push({ key: `missing_notification:${s.id}`, alert_type: "missing_notification", priority: "high", title: "Manager was not notified", description: `${label} — no manager notification was recorded during this incident.`, child_id: s.child_id, incident_session_id: s.id });
    }
    if (REG40_TYPES.has(s.incident_type)) {
      push({ key: `possible_regulation_40:${s.id}`, alert_type: "possible_regulation_40", priority: "urgent", title: "Possible Regulation 40 consideration", description: `${label} — ${REG40_WORDING}`, child_id: s.child_id, incident_session_id: s.id });
    }
  }

  for (const r of reviews) {
    if (r.manager_review_required && !r.manager_reviewed_at) {
      push({ key: `review:${r.id}`, alert_type: "missing_manager_review", priority: "high", title: "AI-assisted record awaiting approval", description: "A staff-accepted, AI-assisted incident record is waiting for manager review. Original, AI suggestion and final version are all preserved.", child_id: r.child_id, incident_session_id: r.incident_session_id, review_id: r.id });
    }
  }

  alerts.sort((a, b) => {
    const ao = a.status === "open" ? 0 : 1;
    const bo = b.status === "open" ? 0 : 1;
    if (ao !== bo) return ao - bo;
    return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.title.localeCompare(b.title);
  });
  return alerts;
}

// ── Pattern recognition ─────────────────────────────────────────────────────────
const FAMILY_RE = /\bfamil(y|ies)|contact|phone call|call with|mum\b|dad\b|mother|father\b/i;

export function detectPatterns(input: OversightInput): PatternInsight[] {
  const { sessions, entries, reviews, restoratives, today } = input;
  const insights: PatternInsight[] = [];
  const recent = sessions.filter((s) => {
    const d = iso(s.started_at);
    return d && daysAgo(d, today) <= 30 && daysAgo(d, today) >= 0;
  });
  const entriesBySession = new Map<string, IncidentTimelineEntry[]>();
  for (const e of entries) {
    const list = entriesBySession.get(e.incident_session_id) ?? [];
    list.push(e);
    entriesBySession.set(e.incident_session_id, list);
  }
  const byChild = new Map<string, IncidentSession[]>();
  for (const s of recent) {
    const list = byChild.get(s.child_id) ?? [];
    list.push(s);
    byChild.set(s.child_id, list);
  }

  for (const [child_id, list] of byChild) {
    // frequency
    if (list.length >= 3) {
      insights.push({
        key: `frequency:${child_id}`, kind: "repeated_incident_pattern", severity: "attention",
        title: "Increased incident frequency",
        insight: `Cara has identified ${list.length} incidents for this child in the last 30 days.`,
        child_id, count: list.length,
        suggestion: "Consider a multi-disciplinary review of triggers, support plans and what is changing for the child.",
      });
    }
    // escalation: last 14d vs the 14 before
    const last14 = list.filter((s) => daysAgo(iso(s.started_at)!, today) <= 14).length;
    const prior14 = list.length - last14;
    if (last14 >= 2 && last14 > prior14) {
      insights.push({
        key: `escalation:${child_id}`, kind: "repeated_incident_pattern", severity: "attention",
        title: "Rising incident frequency",
        insight: `Incidents are increasing: ${last14} in the last 14 days vs ${prior14} in the 14 days before.`,
        child_id, count: last14,
        suggestion: "Review early-warning signs with the team and consider whether the risk assessment reflects the current picture.",
      });
    }
    // family-contact link
    const familyLinked = list.filter((s) =>
      s.incident_type === "family_contact_distress" ||
      (entriesBySession.get(s.id) ?? []).some((e) => FAMILY_RE.test(e.raw_text)));
    if (familyLinked.length >= 2) {
      insights.push({
        key: `family_contact:${child_id}`, kind: "repeated_incident_pattern", severity: "attention",
        title: "Incidents linked to family contact",
        insight: `Cara has identified that ${familyLinked.length} incidents in the last 30 days occurred after family contact. Consider reviewing the child's family contact support plan, emotional preparation before calls, and post-contact regulation support.`,
        child_id, count: familyLinked.length,
        suggestion: "Key-work session on family contact; review the contact support plan.",
      });
    }
    // bedtime dysregulation (19:00–23:59)
    const bedtime = list.filter((s) => {
      const h = Number(String(s.started_at).slice(11, 13));
      return h >= 19 && h <= 23;
    });
    if (bedtime.length >= 2) {
      insights.push({
        key: `bedtime:${child_id}`, kind: "repeated_incident_pattern", severity: "watch",
        title: "Repeated evening / bedtime dysregulation",
        insight: `${bedtime.length} of this child's incidents in the last 30 days started between 7pm and midnight.`,
        child_id, count: bedtime.length,
        suggestion: "Review the bedtime routine, sensory environment and staffing pattern in the evening.",
      });
    }
    // repeated same type (beyond family contact, which has its own insight)
    const byType = new Map<string, number>();
    for (const s of list) byType.set(s.incident_type, (byType.get(s.incident_type) ?? 0) + 1);
    for (const [type, count] of byType) {
      if (count >= 2 && type !== "family_contact_distress") {
        insights.push({
          key: `repeat_type:${child_id}:${type}`, kind: "repeated_incident_pattern", severity: "watch",
          title: `Repeated ${typeLabel(type).toLowerCase()}`,
          insight: `${count} ${typeLabel(type).toLowerCase()} incidents for this child in the last 30 days.`,
          child_id, count,
          suggestion: "Look for the shared trigger or unmet need across these incidents.",
        });
      }
    }
    // missing child voice across ended sessions
    const ended = list.filter((s) => s.incident_status !== "active");
    const noVoice = ended.filter((s) => !(entriesBySession.get(s.id) ?? []).some((e) => e.entry_type === "child_voice" && e.raw_text.trim()));
    if (noVoice.length >= 2) {
      insights.push({
        key: `missing_voice:${child_id}`, kind: "missing_child_voice", severity: "attention",
        title: "Child's voice often missing",
        insight: "Cara has identified that records for this child often miss the child's voice. Consider a key-work session or advocacy support.",
        child_id, count: noVoice.length,
        suggestion: "Plan how and when this child is best supported to share their view.",
      });
    }
    // missing restorative follow-up
    const restorativeSessions = new Set(restoratives.map((r) => r.incident_session_id));
    const noRestorative = ended.filter((s) => !restorativeSessions.has(s.id) && !(entriesBySession.get(s.id) ?? []).some((e) => e.entry_type === "restorative_action"));
    if (noRestorative.length >= 2) {
      insights.push({
        key: `missing_restorative:${child_id}`, kind: "missing_debrief", severity: "watch",
        title: "Restorative follow-up gaps",
        insight: `${noRestorative.length} incidents for this child have no restorative follow-up recorded.`,
        child_id, count: noRestorative.length,
        suggestion: "Build restorative conversations into the post-incident routine for this child.",
      });
    }
  }

  // staff recording-quality themes (supportive, not blaming)
  const flaggedByUser = new Map<string, number>();
  for (const r of reviews) {
    if ((r.ai_quality_flags ?? []).length > 0) flaggedByUser.set(r.user_id, (flaggedByUser.get(r.user_id) ?? 0) + 1);
  }
  for (const [user_id, count] of flaggedByUser) {
    if (count >= 2) {
      insights.push({
        key: `recording_quality:${user_id}`, kind: "recording_quality_issue", severity: "watch",
        title: "Recording-quality coaching theme",
        insight: `${count} AI-assisted records from one staff member carried quality flags (e.g. missing context or child's voice).`,
        child_id: null, count,
        suggestion: "Offer a supportive coaching conversation in supervision — focus on what good recording looks like, not blame.",
      });
    }
  }

  // same staff + child pairing
  const pair = new Map<string, number>();
  for (const s of recent) pair.set(`${s.started_by_user_id}|${s.child_id}`, (pair.get(`${s.started_by_user_id}|${s.child_id}`) ?? 0) + 1);
  for (const [key, count] of pair) {
    if (count >= 3) {
      const [, child_id] = key.split("|");
      insights.push({
        key: `staff_child:${key}`, kind: "staff_support_needed", severity: "info",
        title: "Same staff–child pairing recurring",
        insight: `${count} recent incidents involve the same staff member and child.`,
        child_id, count,
        suggestion: "Consider whether the staff member needs support, debriefing, or whether pairing changes would help — this is a support prompt, not a blame signal.",
      });
    }
  }

  const sevRank = { attention: 0, watch: 1, info: 2 };
  insights.sort((a, b) => sevRank[a.severity] - sevRank[b.severity] || b.count - a.count || a.title.localeCompare(b.title));
  return insights;
}

// ── Summary ─────────────────────────────────────────────────────────────────────
export function oversightSummary(alerts: ManagerAlert[], patterns: PatternInsight[], reviewsAwaiting: number) {
  const open = alerts.filter((a) => a.status === "open");
  return {
    open_alerts: open.length,
    urgent: open.filter((a) => a.priority === "urgent").length,
    reviews_awaiting: reviewsAwaiting,
    patterns: patterns.length,
    headline: open.length === 0 && patterns.length === 0
      ? "Nothing needs your oversight right now."
      : `${open.length} alert${open.length === 1 ? "" : "s"} open${reviewsAwaiting ? ` · ${reviewsAwaiting} record${reviewsAwaiting === 1 ? "" : "s"} awaiting approval` : ""}${patterns.length ? ` · ${patterns.length} pattern${patterns.length === 1 ? "" : "s"} worth a look` : ""}.`,
  };
}
