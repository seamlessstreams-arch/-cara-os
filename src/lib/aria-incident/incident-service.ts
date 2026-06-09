// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ARIA INCIDENT MODE · SERVICE LAYER (server-side only)
//
// Session lifecycle, timeline writes, the GET bundle, and audit logging. All AI
// calls stay server-side (generateText). Audit entries are GDPR-light: they
// reference the session/entry ids rather than duplicating child narrative into
// the audit trail.
// ══════════════════════════════════════════════════════════════════════════════

import { getStore } from "@/lib/db/store";
import { generateId } from "@/lib/utils";
import { intelligenceDb } from "@/lib/intelligence/store";
import type { AuditActionType } from "@/types/extended";
import {
  buildWorkflowChecklist, pickLivePrompts, computeIncidentQualityGate,
  CHILD_VOICE_PROMPTS, CHILD_DECLINED_PROMPTS, INCIDENT_DISCLAIMER, INCIDENT_TYPES, ENTRY_TYPES,
  type IncidentSession, type IncidentTimelineEntry, type RiskLevel,
} from "./aria-incident-engine";

export const DEFAULT_USER_ID = "staff_darren";

export function currentUserId(req: Request): string {
  return req.headers.get("x-user-id")?.trim() || DEFAULT_USER_ID;
}

export function logIncidentAudit(opts: {
  action_type: AuditActionType;
  user_id: string;
  child_id?: string;
  source_id?: string;
  note?: string;          // short, non-narrative metadata only
  approval_status?: string;
}): void {
  try {
    intelligenceDb.ariaAuditTrail.create({
      home_id: "home_oak",
      user_id: opts.user_id,
      child_id: opts.child_id,
      action_type: opts.action_type,
      source_table: "aria_incident_sessions",
      source_id: opts.source_id,
      human_edit: opts.note,
      approval_status: opts.approval_status,
    });
  } catch {
    // audit must never break the operational flow
  }
}

export function childName(childId: string): string {
  const store = getStore() as any;
  const c = ((store.youngPeople ?? []) as any[]).find((y) => y.id === childId);
  return c?.preferred_name || [c?.first_name, c?.last_name].filter(Boolean).join(" ") || childId;
}

export function staffNameOf(staffId: string): string {
  const store = getStore() as any;
  const s = ((store.staff ?? []) as any[]).find((x) => x.id === staffId);
  return s?.full_name || [s?.first_name, s?.last_name].filter(Boolean).join(" ") || staffId;
}

export function findSession(sessionId: string): IncidentSession | null {
  const store = getStore() as any;
  return ((store.ariaIncidentSessions ?? []) as IncidentSession[]).find((s) => s.id === sessionId) ?? null;
}

export function sessionEntries(sessionId: string): IncidentTimelineEntry[] {
  const store = getStore() as any;
  return ((store.ariaIncidentTimeline ?? []) as IncidentTimelineEntry[])
    .filter((e) => e.incident_session_id === sessionId)
    .sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
}

export function startSession(opts: { child_id: string; incident_type: string; immediate_risk_level: RiskLevel; user_id: string }): IncidentSession {
  const store = getStore() as any;
  const now = new Date().toISOString();
  const session: IncidentSession = {
    id: generateId("ais"),
    home_id: "home_oak",
    child_id: opts.child_id,
    started_by_user_id: opts.user_id,
    started_at: now,
    ended_at: null,
    incident_type: opts.incident_type,
    incident_status: "active",
    immediate_risk_level: opts.immediate_risk_level,
    manager_notified: false,
    manager_notified_at: null,
    ai_support_used: true,
    final_record_created: false,
    workflow_progress: {},
    created_at: now,
    updated_at: now,
  };
  store.ariaIncidentSessions = store.ariaIncidentSessions ?? [];
  store.ariaIncidentSessions.push(session);
  logIncidentAudit({ action_type: "incident_started", user_id: opts.user_id, child_id: opts.child_id, source_id: session.id, note: `type=${opts.incident_type} risk=${opts.immediate_risk_level}` });
  return session;
}

export function addTimelineEntry(opts: { session: IncidentSession; entry_type: string; raw_text: string; user_id: string }): IncidentTimelineEntry {
  const store = getStore() as any;
  const now = new Date().toISOString();
  const entry: IncidentTimelineEntry = {
    id: generateId("ait"),
    incident_session_id: opts.session.id,
    home_id: opts.session.home_id,
    child_id: opts.session.child_id,
    user_id: opts.user_id,
    entry_type: opts.entry_type,
    raw_text: opts.raw_text,
    ai_rewritten_text: null,
    accepted_text: null,
    timestamp: now,
    created_at: now,
  };
  store.ariaIncidentTimeline = store.ariaIncidentTimeline ?? [];
  store.ariaIncidentTimeline.push(entry);
  opts.session.updated_at = now;
  logIncidentAudit({ action_type: "timeline_entry_added", user_id: opts.user_id, child_id: opts.session.child_id, source_id: opts.session.id, note: `entry=${entry.id} type=${opts.entry_type}` });
  return entry;
}

export function buildSessionBundle(session: IncidentSession) {
  const entries = sessionEntries(session.id);
  const steps = buildWorkflowChecklist(session.incident_type);
  const prompts = pickLivePrompts(session.incident_type, session.immediate_risk_level);
  // merge the home's ACTIVE custom co-regulation prompts (practice library) into live mode
  const store = getStore() as any;
  const custom = ((store.ariaPromptBank ?? []) as any[])
    .filter((p) => p.custom && p.is_active && p.category === "co_regulation" && (!p.incident_type || p.incident_type === session.incident_type))
    .map((p) => String(p.prompt_text));
  prompts.immediate = [...new Set([...prompts.immediate, ...custom])].slice(0, 8);
  return {
    session,
    child_name: childName(session.child_id),
    started_by_name: staffNameOf(session.started_by_user_id),
    timeline: entries,
    checklist: steps.map((s) => ({ ...s, completed: !!session.workflow_progress[s.key] })),
    prompts,
    gate: computeIncidentQualityGate({ session, entries }),
    child_voice_prompts: CHILD_VOICE_PROMPTS,
    child_declined_prompts: CHILD_DECLINED_PROMPTS,
    incident_types: INCIDENT_TYPES,
    entry_types: ENTRY_TYPES,
    disclaimer: INCIDENT_DISCLAIMER,
  };
}
