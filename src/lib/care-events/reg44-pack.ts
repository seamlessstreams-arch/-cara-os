// ══════════════════════════════════════════════════════════════════════════════
// CARA — Reg 44 Visit Evidence Pack  (Milestone 33)
//
// Auto-generated bundle for the independent visitor: every record they
// typically request for the upcoming Regulation 44 visit, scoped to the
// chosen visit window (default last 30 days).
//
// Generated on demand. Stateless. Deterministic from current data.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import type { Incident } from "@/types";
import type {
  MissingEpisode,
  RestraintRecord,
  ComplaintOutcomeRecord,
  KeyWorkingSession,
} from "@/types/extended";
import type { CareEvent } from "@/types/care-events";
import type {
  CaraReg40Triage,
  CaraSafeguardingPattern,
  CaraReg45EvidenceItem,
} from "@/types/cara-studio";

// ── Public types ─────────────────────────────────────────────────────────────

export interface Reg44Window { start: string; end: string }

export interface Reg44ChildSnapshot {
  child_id: string;
  preferred_name: string;
  legal_status: string;
  placement_start: string;
  risk_flags: string[];
  social_worker_name: string;
  iro_name: string | null;
  status: string;
}

export interface Reg44Pack {
  id: string;
  home_id: string;
  generated_at: string;
  generated_by: string | null;
  window: Reg44Window;
  schema_version: 1;
  headline: {
    children_in_residence: number;
    incidents: number;
    incidents_critical: number;
    missing_episodes: number;
    missing_high_risk: number;
    restraints: number;
    restraints_with_injuries: number;
    complaints: number;
    complaints_unresolved: number;
    safeguarding_events: number;
    reg40_notifications: number;
    keywork_sessions: number;
    safeguarding_patterns_open: number;
    verified_reg45_evidence: number;
    last_visit_recommendations_outstanding: number;
  };
  children: Reg44ChildSnapshot[];
  incidents: Incident[];
  missing_episodes: MissingEpisode[];
  restraints: RestraintRecord[];
  complaints: ComplaintOutcomeRecord[];
  safeguarding_events: CareEvent[];
  reg40_notifications: CaraReg40Triage[];
  keywork_sessions: KeyWorkingSession[];
  safeguarding_patterns: CaraSafeguardingPattern[];
  verified_reg45_evidence: CaraReg45EvidenceItem[];
  previous_visit: {
    visit_id: string | null;
    visit_date: string | null;
    overall_judgement: string | null;
    outstanding_recommendations: { id: string; recommendation: string; priority: string; status: string }[];
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isoDate(d: Date): string { return d.toISOString().slice(0, 10); }

function defaultWindow(days = 30): Reg44Window {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return { start: isoDate(start), end: isoDate(end) };
}

function inWindow(date: string | null | undefined, w: Reg44Window): boolean {
  if (!date) return false;
  const d = date.length > 10 ? date.slice(0, 10) : date;
  return d >= w.start && d <= w.end;
}

// ── Engine ───────────────────────────────────────────────────────────────────

export function generateReg44Pack(
  homeId: string,
  opts: { window?: Reg44Window; generatedBy?: string | null } = {},
): Reg44Pack {
  const window = opts.window ?? defaultWindow(30);
  const generated_at = new Date().toISOString();

  const childrenInHome = db.youngPeople
    .findAll()
    .filter((y) => y.home_id === homeId && y.status === "current");
  const childIds = new Set(childrenInHome.map((y) => y.id));

  const children: Reg44ChildSnapshot[] = childrenInHome.map((y) => ({
    child_id: y.id,
    preferred_name: y.preferred_name ?? `${y.first_name} ${y.last_name.slice(0, 1)}`,
    legal_status: y.legal_status,
    placement_start: y.placement_start,
    risk_flags: y.risk_flags,
    social_worker_name: y.social_worker_name,
    iro_name: y.iro_name,
    status: y.status,
  }));

  const incidents = db.incidents
    .findAll()
    .filter((i) => i.home_id === homeId && inWindow(i.date, window))
    .sort((a, b) => b.date.localeCompare(a.date));

  const missing_episodes = db.missingEpisodes
    .findAll()
    .filter((m) => childIds.has(m.child_id) && inWindow(m.date_missing, window))
    .sort((a, b) => b.date_missing.localeCompare(a.date_missing));

  const restraints = db.restraints
    .findAll()
    .filter((r) => childIds.has(r.child_id) && inWindow(r.date, window))
    .sort((a, b) => b.date.localeCompare(a.date));

  const complaints = db.complaintOutcomeRecords
    .findAll()
    .filter((c) =>
      (c.child_id === null || childIds.has(c.child_id))
      && inWindow(c.complaint_date, window),
    )
    .sort((a, b) => b.complaint_date.localeCompare(a.complaint_date));

  const safeguarding_events = db.careEvents
    .findCurrent()
    .filter((e) =>
      e.home_id === homeId
      && e.status === "verified"
      && (e.is_safeguarding || e.category === "safeguarding")
      && inWindow((e.verified_at ?? e.event_date).slice(0, 10), window),
    )
    .sort((a, b) => (b.verified_at ?? b.event_date).localeCompare(a.verified_at ?? a.event_date));

  const reg40_notifications = db.caraReg40Triages
    .findAll(homeId)
    .filter((t) => inWindow(t.created_at?.slice(0, 10), window))
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));

  const keywork_sessions = db.keyWorkingSessions
    .findAll()
    .filter((s) => s.home_id === homeId && inWindow(s.date, window))
    .sort((a, b) => b.date.localeCompare(a.date));

  const safeguarding_patterns = db.caraSafeguardingPatterns
    .findAll(homeId)
    .filter((p) => p.status !== "dismissed");

  const verified_reg45_evidence = db.caraReg45EvidenceItems
    .findAll(homeId)
    .filter((r) => (r.status === "accepted" || r.status === "included_in_report")
      && inWindow(r.occurred_at, window));

  // Previous Reg 44 visit + outstanding recommendations
  const previous = db.reg44VisitReports
    .findAll()
    .filter((v) => v.home_id === homeId)
    .sort((a, b) => b.visit_date.localeCompare(a.visit_date))[0] ?? null;

  const outstanding_recommendations = previous
    ? previous.recommendations
        .filter((r) => r.status !== "completed")
        .map((r) => ({ id: r.id, recommendation: r.recommendation, priority: r.priority, status: r.status }))
    : [];

  const headline = {
    children_in_residence: children.length,
    incidents: incidents.length,
    incidents_critical: incidents.filter((i) => i.severity === "critical").length,
    missing_episodes: missing_episodes.length,
    missing_high_risk: missing_episodes.filter((m) => m.risk_level === "high" || m.risk_level === "critical").length,
    restraints: restraints.length,
    restraints_with_injuries: restraints.filter((r) => r.injuries.length > 0).length,
    complaints: complaints.length,
    complaints_unresolved: complaints.filter((c) => !c.complainant_satisfied || c.escalated).length,
    safeguarding_events: safeguarding_events.length,
    reg40_notifications: reg40_notifications.length,
    keywork_sessions: keywork_sessions.length,
    safeguarding_patterns_open: safeguarding_patterns.length,
    verified_reg45_evidence: verified_reg45_evidence.length,
    last_visit_recommendations_outstanding: outstanding_recommendations.length,
  };

  const id = `r44pack_${homeId}_${generated_at.replace(/[:.]/g, "")}`;

  return {
    id,
    home_id: homeId,
    generated_at,
    generated_by: opts.generatedBy ?? null,
    window,
    schema_version: 1,
    headline,
    children,
    incidents,
    missing_episodes,
    restraints,
    complaints,
    safeguarding_events,
    reg40_notifications,
    keywork_sessions,
    safeguarding_patterns,
    verified_reg45_evidence,
    previous_visit: {
      visit_id: previous?.id ?? null,
      visit_date: previous?.visit_date ?? null,
      overall_judgement: previous?.overall_judgement ?? null,
      outstanding_recommendations,
    },
  };
}

// ── Persistence (M35) ────────────────────────────────────────────────────────
//
// Reg 44 packs are immutable evidence. Once persisted they are never
// modified. The id is deterministic per home + generated_at so re-saving the
// same pack is a no-op. Read APIs surface them in newest-first order.

import type { PersistedReg44Pack } from "@/lib/db/store";

export interface PersistedReg44PackRow {
  id: string;
  home_id: string;
  generated_at: string;
  generated_by: string | null;
  schema_version: number;
  window_start: string;
  window_end: string;
  headline_children: number;
  headline_safeguarding_events: number;
}

export function persistReg44Pack(pack: Reg44Pack): PersistedReg44Pack {
  const row: PersistedReg44Pack = {
    id: pack.id,
    home_id: pack.home_id,
    generated_at: pack.generated_at,
    generated_by: pack.generated_by,
    schema_version: pack.schema_version,
    window_start: pack.window.start,
    window_end: pack.window.end,
    headline_children: pack.headline.children_in_residence,
    headline_safeguarding_events: pack.headline.safeguarding_events,
    payload: pack,
  };
  return db.reg44Packs.create(row);
}

export function listPersistedReg44Packs(homeId: string): PersistedReg44PackRow[] {
  return db.reg44Packs
    .findAll(homeId)
    .map(({ payload: _payload, ...row }) => row)
    .sort((a, b) => b.generated_at.localeCompare(a.generated_at));
}

export function getPersistedReg44Pack(id: string): PersistedReg44Pack | null {
  return db.reg44Packs.findById(id);
}
