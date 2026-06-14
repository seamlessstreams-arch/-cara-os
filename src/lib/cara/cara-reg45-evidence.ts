// ══════════════════════════════════════════════════════════════════════════════
// Cara Regulation 45 Live Evidence Bank
//
// Continuously surfaces verified records and approved Cara outputs from the
// last review period as themed "evidence chips" that managers can accept,
// defer or reject before they enter the official Reg 45 report.
//
// Evidence is provisional until accepted. Accepted chips become the manager's
// curated source pool for the report builder; rejected/deferred chips remain
// audit-visible but do not appear in the final wording.
//
// Idempotent on (home_id, source_table, source_id) — reruns refresh existing
// chips in place rather than creating duplicates.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import type {
  CaraReg45EvidenceItem,
  CaraReg45EvidenceSentiment,
  CaraReg45Snapshot,
  CaraReg45Theme,
  CaraPatternSeverity,
  CaraSourceType,
} from "@/types/cara-studio";
import { CARA_REG45_THEME_LABELS } from "@/types/cara-studio";

const DEFAULT_PERIOD_DAYS = 180;

interface RunOptions {
  periodStart?: string;
  periodEnd?: string;
}

interface DraftItem {
  child_id: string | null;
  theme: CaraReg45Theme;
  title: string;
  summary: string;
  severity: CaraPatternSeverity | "positive";
  sentiment: CaraReg45EvidenceSentiment;
  source_type: CaraSourceType;
  source_table: string;
  source_id: string;
  occurred_at: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function defaultPeriod(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - DEFAULT_PERIOD_DAYS);
  return { start: isoDate(start), end: isoDate(end) };
}

function inPeriod(date: string | null | undefined, start: string, end: string): boolean {
  if (!date) return false;
  const d = date.length > 10 ? date.slice(0, 10) : date;
  return d >= start && d <= end;
}

function emptyThemeMap(): Record<CaraReg45Theme, CaraReg45EvidenceItem[]> {
  const out = {} as Record<CaraReg45Theme, CaraReg45EvidenceItem[]>;
  for (const t of Object.keys(CARA_REG45_THEME_LABELS) as CaraReg45Theme[]) {
    out[t] = [];
  }
  return out;
}

function emptyByTheme(): Record<CaraReg45Theme, number> {
  const out = {} as Record<CaraReg45Theme, number>;
  for (const t of Object.keys(CARA_REG45_THEME_LABELS) as CaraReg45Theme[]) {
    out[t] = 0;
  }
  return out;
}

// ── Source collectors ────────────────────────────────────────────────────────

function collectSafeguardingPatterns(homeId: string, start: string, end: string): DraftItem[] {
  return db.caraSafeguardingPatterns
    .findAll(homeId)
    .filter((p) => p.status !== "dismissed" && inPeriod(p.detected_at?.slice(0, 10), start, end))
    .map<DraftItem>((p) => ({
      child_id: p.child_id,
      theme: "safeguarding",
      title: p.title,
      summary: p.description,
      severity: p.severity,
      sentiment: "concern",
      source_type: "safeguarding",
      source_table: "cara_safeguarding_patterns",
      source_id: p.id,
      occurred_at: p.detected_at?.slice(0, 10) ?? p.window_end,
    }));
}

function collectEarlyWarnings(homeId: string, start: string, end: string): DraftItem[] {
  return db.caraEarlyWarnings
    .findAll(homeId)
    .filter((w) => inPeriod(w.created_at?.slice(0, 10), start, end))
    .map<DraftItem>((w) => ({
      child_id: w.child_id,
      theme: w.severity === "critical" || w.severity === "high" ? "safeguarding" : "leadership_management",
      title: w.title,
      summary: w.rationale,
      severity: w.severity,
      sentiment: "concern",
      source_type: "safeguarding",
      source_table: "cara_early_warnings",
      source_id: w.id,
      occurred_at: w.created_at?.slice(0, 10) ?? start,
    }));
}

function collectFormulations(homeId: string, start: string, end: string): DraftItem[] {
  return db.caraFormulations
    .findAll(homeId)
    .filter((f) => f.status === "approved" && inPeriod(f.approved_at?.slice(0, 10), start, end))
    .map<DraftItem>((f) => ({
      child_id: f.child_id,
      theme: "quality_of_care",
      title: `Approved formulation — ${f.title}`,
      summary: f.narrative.slice(0, 300),
      severity: "medium",
      sentiment: "neutral",
      source_type: "management_oversight",
      source_table: "cara_formulations",
      source_id: f.id,
      occurred_at: (f.approved_at ?? f.generated_at).slice(0, 10),
    }));
}

function collectRecommendations(homeId: string, start: string, end: string): DraftItem[] {
  return db.caraDecisionRecommendations
    .findAll(homeId)
    .filter(
      (r) =>
        (r.status === "accepted" || r.status === "completed") &&
        inPeriod((r.decided_at ?? r.generated_at).slice(0, 10), start, end),
    )
    .map<DraftItem>((r) => ({
      child_id: r.child_id,
      theme: "leadership_management",
      title: r.title,
      summary: r.rationale,
      severity: r.priority === "p1" ? "critical" : r.priority === "p2" ? "high" : r.priority === "p3" ? "medium" : "low",
      sentiment: r.status === "completed" ? "positive" : "neutral",
      source_type: "management_oversight",
      source_table: "cara_decision_recommendations",
      source_id: r.id,
      occurred_at: (r.decided_at ?? r.generated_at).slice(0, 10),
    }));
}

function collectIncidents(homeId: string, start: string, end: string): DraftItem[] {
  return db.incidents
    .findAll()
    .filter((i) => i.home_id === homeId && inPeriod(i.date, start, end))
    .map<DraftItem>((i) => ({
      child_id: i.child_id,
      theme: "safeguarding",
      title: `${i.type} incident — ${i.reference}`,
      summary: i.description.slice(0, 300),
      severity:
        i.severity === "critical"
          ? "critical"
          : i.severity === "high"
            ? "high"
            : i.severity === "medium"
              ? "medium"
              : "low",
      sentiment: "concern",
      source_type: "incident",
      source_table: "incidents",
      source_id: i.id,
      occurred_at: i.date,
    }));
}

function collectMissingEpisodes(homeId: string, start: string, end: string): DraftItem[] {
  // missingEpisodes carry no home_id; scope by child→home via youngPersons
  const childrenForHome = new Set(
    db.youngPeople.findAll().filter((y) => y.home_id === homeId).map((y) => y.id),
  );
  return db.missingEpisodes
    .findAll()
    .filter((m) => childrenForHome.has(m.child_id) && inPeriod(m.date_missing, start, end))
    .map<DraftItem>((m) => ({
      child_id: m.child_id,
      theme: "safeguarding",
      title: `Missing episode — ${m.reference}`,
      summary: `Risk: ${m.risk_level}; last seen ${m.location_last_seen}; duration ${m.duration_hours ?? "unknown"}h.`,
      severity: m.risk_level,
      sentiment: "concern",
      source_type: "missing_from_care",
      source_table: "missing_episodes",
      source_id: m.id,
      occurred_at: m.date_missing,
    }));
}

function collectRestraints(homeId: string, start: string, end: string): DraftItem[] {
  const childrenForHome = new Set(
    db.youngPeople.findAll().filter((y) => y.home_id === homeId).map((y) => y.id),
  );
  return db.restraints
    .findAll()
    .filter((r) => childrenForHome.has(r.child_id) && inPeriod(r.date, start, end))
    .map<DraftItem>((r) => ({
      child_id: r.child_id,
      theme: "safeguarding",
      title: `Physical intervention — ${r.restraint_type}`,
      summary: `${r.reason}. Duration ${r.duration} mins. ${r.justification.slice(0, 160)}`,
      severity: r.injuries.length > 0 ? "high" : "medium",
      sentiment: "concern",
      source_type: "incident",
      source_table: "restraints",
      source_id: r.id,
      occurred_at: r.date,
    }));
}

function collectComplaints(homeId: string, start: string, end: string): DraftItem[] {
  const childrenForHome = new Set(
    db.youngPeople.findAll().filter((y) => y.home_id === homeId).map((y) => y.id),
  );
  return db.complaintOutcomeRecords
    .findAll()
    .filter(
      (c) =>
        // Child-specific complaints scope to the child's home. Home-level
        // complaints (no child_id) only belong to a populated home — they must
        // not leak into an unknown/empty home with no children.
        ((c.child_id === null && childrenForHome.size > 0) ||
          (c.child_id !== null && childrenForHome.has(c.child_id))) &&
        inPeriod(c.complaint_date, start, end),
    )
    .map<DraftItem>((c) => ({
      child_id: c.child_id,
      theme: "complaints_voice",
      title: `Complaint — ${c.theme}`,
      summary: c.summary.slice(0, 300),
      severity: c.escalated ? "high" : "medium",
      sentiment: c.complainant_satisfied ? "positive" : "concern",
      source_type: "complaint",
      source_table: "complaint_outcome_records",
      source_id: c.id,
      occurred_at: c.complaint_date,
    }));
}

function collectKeywork(homeId: string, start: string, end: string): DraftItem[] {
  return db.keyWorkingSessions
    .findAll()
    .filter((s) => s.home_id === homeId && inPeriod(s.date, start, end))
    .map<DraftItem>((s) => ({
      child_id: s.child_id,
      theme: "quality_of_care",
      title: `Key-working session (${s.type})`,
      summary:
        s.child_voice?.slice(0, 220) || s.worker_observations?.slice(0, 220) || "Key-working session recorded.",
      severity: "positive",
      sentiment: "positive",
      source_type: "keywork",
      source_table: "key_working_sessions",
      source_id: s.id,
      occurred_at: s.date,
    }));
}

// ── Verified Care Event direct evidence (M32) ────────────────────────────────
//
// When a Care Event has been verified by a manager AND was flagged as
// `contributes_to_reg45`, the verified record itself becomes a Reg 45
// evidence chip — distinct from any pattern/safeguarding chip that may
// already have been derived from the same incident. The chip points back
// to the source care event so the manager can see the full record before
// accepting/deferring/rejecting.

const REG45_THEME_BY_CATEGORY: Record<import("@/types/care-events").CareEventCategory, CaraReg45Theme> = {
  general:               "quality_of_care",
  behaviour:             "quality_of_care",
  health:                "health",
  medication:            "health",
  education:             "education",
  family_contact:        "contact_with_family",
  professional_contact:  "leadership_management",
  safeguarding:          "safeguarding",
  missing_episode:       "safeguarding",
  physical_intervention: "safeguarding",
  restraint:             "safeguarding",
  complaint:             "complaints_voice",
  activity:              "outcomes",
  wellbeing:             "quality_of_care",
  sleep:                 "quality_of_care",
  food:                  "quality_of_care",
  finance:               "outcomes",
  other:                 "quality_of_care",
};

const REG45_SAFEGUARDING_CATEGORIES = new Set<import("@/types/care-events").CareEventCategory>([
  "safeguarding",
  "missing_episode",
  "physical_intervention",
  "restraint",
]);

function collectVerifiedCareEvents(homeId: string, start: string, end: string): DraftItem[] {
  return db.careEvents
    .findCurrent()
    .filter((e) =>
      e.home_id === homeId
      && e.contributes_to_reg45
      && e.status === "verified"
      && inPeriod((e.verified_at ?? e.event_date).slice(0, 10), start, end),
    )
    .map<DraftItem>((e) => {
      const isConcern = e.is_safeguarding || REG45_SAFEGUARDING_CATEGORIES.has(e.category);
      const severity: CaraPatternSeverity | "positive" =
        e.is_safeguarding
          ? "high"
          : REG45_SAFEGUARDING_CATEGORIES.has(e.category)
            ? "medium"
            : e.is_significant
              ? "medium"
              : "low";
      return {
        child_id: e.child_id,
        theme: REG45_THEME_BY_CATEGORY[e.category],
        title: `Verified care event — ${e.title}`,
        summary: e.content.slice(0, 300),
        severity,
        sentiment: isConcern ? "concern" : "neutral",
        source_type: "management_oversight",
        source_table: "care_events",
        source_id: e.id,
        occurred_at: (e.verified_at ?? e.event_date).slice(0, 10),
      };
    });
}

function collectFamilyTime(homeId: string, start: string, end: string): DraftItem[] {  const childrenForHome = new Set(
    db.youngPeople.findAll().filter((y) => y.home_id === homeId).map((y) => y.id),
  );
  return db.familyTimeSessions
    .findAll()
    .filter((s) => childrenForHome.has(s.child_id) && inPeriod(s.date, start, end))
    .map<DraftItem>((s) => ({
      child_id: s.child_id,
      theme: "contact_with_family",
      title: `Family time — ${s.family_member_name || s.family_member}`,
      summary:
        s.interactions_observed?.slice(0, 220) ||
        (s.positive_observations.length > 0
          ? s.positive_observations.join("; ").slice(0, 220)
          : "Family time session recorded."),
      severity: s.was_it_safe ? "positive" : "high",
      sentiment: s.was_it_safe && s.concerns_raised.length === 0 ? "positive" : "concern",
      source_type: "daily_log",
      source_table: "family_time_sessions",
      source_id: s.id,
      occurred_at: s.date,
    }));
}

// ── Engine ───────────────────────────────────────────────────────────────────

function upsertEvidenceItem(
  homeId: string,
  draft: DraftItem,
  periodStart: string,
  periodEnd: string,
): CaraReg45EvidenceItem {
  const existing = db.caraReg45EvidenceItems.findBySource(homeId, draft.source_table, draft.source_id);

  if (existing) {
    // Refresh draft fields but never silently flip a manager decision.
    const patched = db.caraReg45EvidenceItems.patch(existing.id, {
      title: draft.title,
      summary: draft.summary,
      severity: draft.severity,
      sentiment: draft.sentiment,
      theme: draft.theme,
      occurred_at: draft.occurred_at,
      period_start: periodStart,
      period_end: periodEnd,
    });
    return patched ?? existing;
  }

  return db.caraReg45EvidenceItems.create({
    home_id: homeId,
    child_id: draft.child_id,
    theme: draft.theme,
    title: draft.title,
    summary: draft.summary,
    severity: draft.severity,
    sentiment: draft.sentiment,
    source_type: draft.source_type,
    source_table: draft.source_table,
    source_id: draft.source_id,
    occurred_at: draft.occurred_at,
    period_start: periodStart,
    period_end: periodEnd,
    status: "ai_draft",
    is_ai_draft: true,
    generated_at: new Date().toISOString(),
    decided_by: null,
    decided_at: null,
    decision_note: null,
    included_in_report_id: null,
  });
}

function buildSnapshot(
  homeId: string,
  periodStart: string,
  periodEnd: string,
  items: CaraReg45EvidenceItem[],
): CaraReg45Snapshot {
  const themes = emptyThemeMap();
  const byTheme = emptyByTheme();
  let aiDraft = 0,
    accepted = 0,
    deferred = 0,
    rejected = 0,
    included = 0,
    concerns = 0,
    positives = 0;

  for (const item of items) {
    themes[item.theme].push(item);
    byTheme[item.theme] += 1;
    if (item.status === "ai_draft") aiDraft += 1;
    else if (item.status === "accepted") accepted += 1;
    else if (item.status === "deferred") deferred += 1;
    else if (item.status === "rejected") rejected += 1;
    else if (item.status === "included_in_report") included += 1;
    if (item.sentiment === "concern") concerns += 1;
    if (item.sentiment === "positive") positives += 1;
  }

  // Sort each theme: most recent first
  for (const t of Object.keys(themes) as CaraReg45Theme[]) {
    themes[t].sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : -1));
  }

  return {
    home_id: homeId,
    period_start: periodStart,
    period_end: periodEnd,
    generated_at: new Date().toISOString(),
    themes,
    summary: {
      total: items.length,
      ai_draft: aiDraft,
      accepted,
      deferred,
      rejected,
      included_in_report: included,
      by_theme: byTheme,
      concerns,
      positives,
    },
  };
}

export function runReg45EvidenceBuild(homeId: string, options: RunOptions = {}): CaraReg45Snapshot {
  const { start: defaultStart, end: defaultEnd } = defaultPeriod();
  const periodStart = options.periodStart ?? defaultStart;
  const periodEnd = options.periodEnd ?? defaultEnd;

  const drafts: DraftItem[] = [
    ...collectSafeguardingPatterns(homeId, periodStart, periodEnd),
    ...collectEarlyWarnings(homeId, periodStart, periodEnd),
    ...collectFormulations(homeId, periodStart, periodEnd),
    ...collectRecommendations(homeId, periodStart, periodEnd),
    ...collectIncidents(homeId, periodStart, periodEnd),
    ...collectMissingEpisodes(homeId, periodStart, periodEnd),
    ...collectRestraints(homeId, periodStart, periodEnd),
    ...collectComplaints(homeId, periodStart, periodEnd),
    ...collectKeywork(homeId, periodStart, periodEnd),
    ...collectFamilyTime(homeId, periodStart, periodEnd),
    ...collectVerifiedCareEvents(homeId, periodStart, periodEnd),
  ];

  for (const d of drafts) {
    upsertEvidenceItem(homeId, d, periodStart, periodEnd);
  }

  const items = db.caraReg45EvidenceItems
    .findAll(homeId)
    .filter((e) => e.period_start === periodStart && e.period_end === periodEnd);

  return buildSnapshot(homeId, periodStart, periodEnd, items);
}

export function loadReg45Evidence(
  homeId: string,
  options: RunOptions = {},
): CaraReg45Snapshot {
  const { start: defaultStart, end: defaultEnd } = defaultPeriod();
  const periodStart = options.periodStart ?? defaultStart;
  const periodEnd = options.periodEnd ?? defaultEnd;

  const items = db.caraReg45EvidenceItems
    .findAll(homeId)
    .filter((e) => e.period_start === periodStart && e.period_end === periodEnd);

  return buildSnapshot(homeId, periodStart, periodEnd, items);
}

// ── Direct bridge: verified care event → Reg 45 evidence chip (M32) ──────────
//
// Called from manager bulk-verify so a verified Care Event flagged as
// `contributes_to_reg45` immediately appears as its own chip in the Reg 45
// evidence bank, separate from any pattern/safeguarding chip already derived
// from the same incident. Returns the upserted item, or null if the event
// is not eligible (missing, wrong home, not contributing, not yet verified).
export function upsertReg45EvidenceForCareEvent(
  homeId: string,
  careEventId: string,
): CaraReg45EvidenceItem | null {
  const e = db.careEvents.findById(careEventId);
  if (!e) return null;
  if (e.home_id !== homeId) return null;
  if (!e.contributes_to_reg45) return null;
  if (e.status !== "verified") return null;

  const drafts = collectVerifiedCareEvents(homeId, "0000-01-01", "9999-12-31")
    .filter((d) => d.source_id === careEventId);
  if (drafts.length === 0) return null;

  const { start, end } = defaultPeriod();
  return upsertEvidenceItem(homeId, drafts[0], start, end);
}
