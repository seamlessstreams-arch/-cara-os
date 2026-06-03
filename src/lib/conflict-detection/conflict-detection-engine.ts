// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CONFLICT DETECTION ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls, and NO
// argless current-time calls. Accepts an injectable `today` (yyyy-mm-dd).
//
// The complement to duplicate detection and the last automation safeguard:
//   • Duplicate detection finds records that are the SAME event captured twice.
//   • Conflict detection finds records that DISAGREE — two accounts of the same
//     child, time or situation that assert contradictory facts.
//
// A conflict is never a clerical nicety: a care log written while a child is
// recorded missing, an injury documented in one record and denied in another, the
// same incident graded "critical" and "low", a staff member delivering care while
// also booked on leave — each is a data-integrity and (often) a safeguarding risk.
//
// SAFEGUARD CONTRACT (non-negotiable):
//   Conflicts are SURFACED FOR A HUMAN TO RECONCILE and are NEVER auto-resolved.
//   ARIA may *suggest* which record is more likely accurate — with its reasoning
//   and a confidence score — but it never edits either record, never hides the
//   disagreement, and never silently picks a winner. Every finding carries
//   status "needs_human_review" and auto_resolved: false.
//
// Detection rules (all deterministic):
//   R1 present_while_missing      — a presence/care event timestamped INSIDE a
//                                   recorded missing episode for the same child.
//   R2 injury_contradiction       — one record documents an injury, another for
//                                   the same child within 24h records none.
//   R3 conflicting_severity       — two near-identical records of the same event
//                                   (same child, same type, ≤12h, high wording
//                                   overlap) grade its risk/severity differently.
//   R4 staff_unavailable_conflict — a staff member is recorded delivering care /
//                                   working inside a period they are on leave.
// ══════════════════════════════════════════════════════════════════════════════

import type { CornerstoneEvent } from "@/types/cornerstone-event";
import { tokenize, jaccard } from "@/lib/duplicate-detection/duplicate-detection-engine";

// ── Output types ────────────────────────────────────────────────────────────

export type ConflictCategory =
  | "present_while_missing"
  | "injury_contradiction"
  | "conflicting_severity"
  | "staff_unavailable_conflict";

export type ConflictSeverity = "critical" | "high" | "medium" | "low";

export interface ConflictEventRef {
  event_id: string;
  event_type: string;
  occurred_at: string;
  summary: string;
  risk_level: string;
}

/** ARIA's advisory view — never changes data, always carries uncertainty. */
export interface AriaConflictAssessment {
  /** Which record ARIA judges more likely accurate (advisory only). null = genuinely unclear. */
  likely_accurate_event_id: string | null;
  reasoning: string;
  confidence: number; // 0–1
}

export interface ConflictFinding {
  /** Stable id derived from category + the two event ids (order-independent). */
  id: string;
  category: ConflictCategory;
  severity: ConflictSeverity;
  /** What the two records disagree on. */
  dimension: string;
  subject_kind: "child" | "staff";
  subject_id: string;
  subject_name: string;
  /** The two contradicting records. event_a is the more authoritative / higher-risk side where one exists. */
  event_a: ConflictEventRef;
  event_b: ConflictEventRef;
  description: string;
  recommended_action: string;
  aria_assessment: AriaConflictAssessment;
  /** Safeguard: every conflict is surfaced for a human and never auto-resolved. */
  status: "needs_human_review";
  auto_resolved: false;
}

export interface ConflictOverview {
  total_events: number;
  conflicts_found: number;
  critical_or_high: number;
  by_category: Record<string, number>;
  subjects_affected: number;
  /** Always 0 — the engine never resolves a conflict on its own. */
  auto_resolved: 0;
}

export interface ConflictAlert {
  severity: ConflictSeverity;
  message: string;
  subject_id?: string;
  category?: ConflictCategory;
}

export interface AriaConflictInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface ConflictDetectionResult {
  overview: ConflictOverview;
  conflicts: ConflictFinding[];
  alerts: ConflictAlert[];
  insights: AriaConflictInsight[];
}

// ── Input ─────────────────────────────────────────────────────────────────────

export interface SubjectRef {
  id: string;
  first_name?: string;
  last_name?: string;
  preferred_name?: string | null;
}

/**
 * A time interval the canonical projection summarises away (a missing episode's
 * return time, a leave request's span). Read from the same store as the spine, so
 * the rules that need precise bounds stay grounded in the same captured data.
 */
export interface SubjectInterval {
  kind: "missing" | "leave";
  subject_kind: "child" | "staff";
  subject_id: string;
  start: string; // ISO
  end: string | null; // ISO, or null for an open/ongoing interval
  label: string;
  /** The canonical event this interval came from, for cross-reference. */
  source_event_id?: string;
  /** Risk level of the source (used to grade the conflict). */
  risk_level?: ConflictSeverity;
}

export interface ConflictDetectionInput {
  events: CornerstoneEvent[];
  intervals?: SubjectInterval[];
  children?: SubjectRef[];
  staff?: SubjectRef[];
  /** Injectable current date (yyyy-mm-dd); defaults to the current ISO date. */
  today?: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

const HOURS_24_MS = 24 * 60 * 60 * 1000;
const HOURS_12_MS = 12 * 60 * 60 * 1000;

/** Wording-overlap bar for "these two records describe the same event". */
const SAME_EVENT_SIMILARITY = 0.5;

/** Event types that unambiguously mean a child was present/cared-for in the home. */
const PRESENCE_TYPES = new Set(["daily_log", "keywork"]);

/** Event types that mean a staff member was on shift / delivering care. */
const WORK_TYPES = new Set([
  "overtime", "supervision", "physical_intervention", "daily_log", "keywork", "incident",
]);

const SEVERITY_RANK: Record<ConflictSeverity, number> = { critical: 4, high: 3, medium: 2, low: 1 };
const RISK_RANK: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

// ── Helpers ─────────────────────────────────────────────────────────────────

function toMs(iso: string): number {
  return new Date(iso).getTime();
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function resolveName(id: string, byId: Map<string, SubjectRef>): string {
  const s = byId.get(id);
  if (!s) return id;
  const full = [s.first_name, s.last_name].filter(Boolean).join(" ").trim();
  return s.preferred_name || full || id;
}

function refOf(e: CornerstoneEvent): ConflictEventRef {
  return {
    event_id: e.id,
    event_type: e.eventType,
    occurred_at: e.occurredAt,
    summary: e.summary,
    risk_level: e.riskLevel,
  };
}

/** Order-independent stable id for a finding about a pair of events. */
function conflictId(category: ConflictCategory, a: string, b: string): string {
  const [x, y] = [a, b].sort();
  return `cf_${category}_${x}__${y}`;
}

/**
 * Classify an event's physical-injury assertion. Negation ("no injuries") is
 * checked first. Medication events are excluded — a medication error's "harm /
 * no harm" describes the medication outcome, not a physical injury to the child,
 * so it must not be read as an injury assertion.
 */
function injuryAssertion(e: CornerstoneEvent): "yes" | "no" | null {
  if (e.eventType === "medication") return null;
  const s = (e.summary ?? "").toLowerCase();
  if (
    /\bno (visible |apparent )?(injur|marks|bruis|wounds?|swelling)|injury[- ]free|denied any injur|no signs of injur|without injur/.test(s)
  ) {
    return "no";
  }
  if (
    e.structuredTags.includes("injury") ||
    /\b(injur|bruis|wound|bleeding|swelling|fracture|laceration)/.test(s)
  ) {
    return "yes";
  }
  return null;
}

// ── Main computation ───────────────────────────────────────────────────────

export function computeConflictDetection(input: ConflictDetectionInput): ConflictDetectionResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const endOfToday = toMs(`${today}T23:59:59.999Z`);

  const childById = new Map<string, SubjectRef>();
  for (const c of input.children ?? []) childById.set(c.id, c);
  const staffById = new Map<string, SubjectRef>();
  for (const s of input.staff ?? []) staffById.set(s.id, s);

  // Deterministic ordering by time then id, independent of input order.
  const events = input.events
    .filter((e) => Number.isFinite(toMs(e.occurredAt)))
    .slice()
    .sort((a, b) => {
      const ma = toMs(a.occurredAt), mb = toMs(b.occurredAt);
      if (ma !== mb) return ma - mb;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });

  const eventById = new Map<string, CornerstoneEvent>();
  for (const e of events) eventById.set(e.id, e);

  const found = new Map<string, ConflictFinding>(); // keyed by stable id → dedupe
  const add = (f: ConflictFinding) => {
    if (!found.has(f.id)) found.set(f.id, f);
  };

  // ── R1: present_while_missing ───────────────────────────────────────────────
  for (const iv of (input.intervals ?? []).filter((i) => i.kind === "missing")) {
    const startMs = toMs(iv.start);
    const endMs = iv.end ? toMs(iv.end) : endOfToday;
    if (!Number.isFinite(startMs)) continue;
    const missingRef: ConflictEventRef = iv.source_event_id && eventById.has(iv.source_event_id)
      ? refOf(eventById.get(iv.source_event_id)!)
      : {
          event_id: iv.source_event_id ?? `missing_${iv.subject_id}_${iv.start}`,
          event_type: "missing", occurred_at: iv.start, summary: iv.label, risk_level: iv.risk_level ?? "high",
        };
    for (const e of events) {
      if (e.childId !== iv.subject_id) continue;
      if (!PRESENCE_TYPES.has(e.eventType)) continue;
      const ms = toMs(e.occurredAt);
      if (ms <= startMs || ms >= endMs) continue; // strictly inside the episode
      const sev: ConflictSeverity = iv.risk_level === "critical" ? "critical" : "high";
      add({
        id: conflictId("present_while_missing", missingRef.event_id, e.id),
        category: "present_while_missing",
        severity: sev,
        dimension: "whereabouts (a child cannot be cared for in the home and missing at the same time)",
        subject_kind: "child",
        subject_id: iv.subject_id,
        subject_name: resolveName(iv.subject_id, childById),
        event_a: missingRef,
        event_b: refOf(e),
        description: `A ${e.eventType.replace(/_/g, " ")} for ${resolveName(iv.subject_id, childById)} is timestamped during a recorded missing episode (${iv.label}). The child cannot have been both missing and cared for in the home at that moment — one of the two records has the wrong time or status.`,
        recommended_action: "Reconcile the timeline: confirm the exact missing/return times and the time of the care log, then correct whichever record is wrong. Do not delete either — annotate the correction.",
        aria_assessment: {
          likely_accurate_event_id: missingRef.event_id,
          reasoning: "A missing episode is a formally-logged safeguarding event (often with police/LA notification), so a routine care log falling inside it is the more likely timing error. Verify against the return-home record before correcting.",
          confidence: 0.6,
        },
        status: "needs_human_review",
        auto_resolved: false,
      });
    }
  }

  // ── R4: staff_unavailable_conflict (working while on leave) ──────────────────
  for (const iv of (input.intervals ?? []).filter((i) => i.kind === "leave")) {
    const startMs = toMs(iv.start);
    const endMs = iv.end ? toMs(iv.end) : endOfToday;
    if (!Number.isFinite(startMs)) continue;
    const leaveRef: ConflictEventRef = iv.source_event_id && eventById.has(iv.source_event_id)
      ? refOf(eventById.get(iv.source_event_id)!)
      : {
          event_id: iv.source_event_id ?? `leave_${iv.subject_id}_${iv.start}`,
          event_type: "staff_absence", occurred_at: iv.start, summary: iv.label, risk_level: iv.risk_level ?? "low",
        };
    for (const e of events) {
      const attributed = e.staffId === iv.subject_id || e.createdBy === iv.subject_id;
      if (!attributed) continue;
      if (!WORK_TYPES.has(e.eventType)) continue;
      const ms = toMs(e.occurredAt);
      if (ms < startMs || ms > endMs) continue;
      add({
        id: conflictId("staff_unavailable_conflict", leaveRef.event_id, e.id),
        category: "staff_unavailable_conflict",
        severity: "medium",
        dimension: "staff availability (recorded as working and on leave at once)",
        subject_kind: "staff",
        subject_id: iv.subject_id,
        subject_name: resolveName(iv.subject_id, staffById),
        event_a: leaveRef,
        event_b: refOf(e),
        description: `${resolveName(iv.subject_id, staffById)} is recorded delivering care / working (${e.eventType.replace(/_/g, " ")}) inside a period also recorded as ${iv.label}. They cannot have been both on leave and on shift.`,
        recommended_action: "Confirm whether the leave was taken or the shift was worked, and correct the rota or leave record. This affects staffing ratios and payroll, so resolve before either is relied upon.",
        aria_assessment: {
          likely_accurate_event_id: null,
          reasoning: "Either record could be the error — leave is sometimes cancelled at short notice and worked, or a shift mis-attributed. There is no reliable signal here as to which is correct, so this needs a human to confirm.",
          confidence: 0.5,
        },
        status: "needs_human_review",
        auto_resolved: false,
      });
    }
  }

  // ── Pairwise rules (R2, R3): bucket by child, compare within a time window ───
  const byChild = new Map<string, CornerstoneEvent[]>();
  for (const e of events) {
    if (!e.childId) continue;
    const arr = byChild.get(e.childId);
    if (arr) arr.push(e);
    else byChild.set(e.childId, [e]);
  }

  for (const [childId, arr] of byChild) {
    const childName = resolveName(childId, childById);
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i], b = arr[j];
        const gap = toMs(b.occurredAt) - toMs(a.occurredAt); // ≥ 0 (sorted)

        // R2: injury contradiction within 24h
        if (gap <= HOURS_24_MS) {
          const ia = injuryAssertion(a), ib = injuryAssertion(b);
          if (ia && ib && ia !== ib) {
            const yes = ia === "yes" ? a : b;
            const no = ia === "yes" ? b : a;
            // The record that documents an injury (often a body-mapped incident/PI) leads as event_a.
            const formal = yes.eventType === "physical_intervention" || yes.eventType === "incident" || yes.eventType === "safeguarding";
            add({
              id: conflictId("injury_contradiction", yes.id, no.id),
              category: "injury_contradiction",
              severity: "high",
              dimension: "injury / physical harm (one record documents an injury, another denies it)",
              subject_kind: "child",
              subject_id: childId,
              subject_name: childName,
              event_a: refOf(yes),
              event_b: refOf(no),
              description: `For ${childName}, one record documents an injury while another within 24 hours records none. These cannot both be a complete account of the same period — the discrepancy must be resolved so the child's injury history is accurate.`,
              recommended_action: "Check the body map, medical/health notes and any photographs to establish the facts, then reconcile both records. Consider whether the omission needs a safeguarding review.",
              aria_assessment: {
                likely_accurate_event_id: formal ? yes.id : null,
                reasoning: formal
                  ? "The record documenting the injury is a formal incident/intervention record (more likely to be body-mapped and reviewed), so it is the more reliable account — but confirm against the body map before treating the other as a simple omission."
                  : "Neither record is clearly more authoritative. A missed injury and a false-positive are both possible, so a human must establish the facts.",
                confidence: formal ? 0.6 : 0.45,
              },
              status: "needs_human_review",
              auto_resolved: false,
            });
          }
        }

        // R3: same event, divergent severity (≤12h, same type, high wording overlap, different risk)
        if (gap <= HOURS_12_MS && a.eventType === b.eventType && a.riskLevel !== b.riskLevel) {
          const sim = jaccard(tokenize(a.summary), tokenize(b.summary));
          if (sim >= SAME_EVENT_SIMILARITY) {
            const higher = RISK_RANK[a.riskLevel] >= RISK_RANK[b.riskLevel] ? a : b;
            const lower = higher === a ? b : a;
            const sev: ConflictSeverity = RISK_RANK[higher.riskLevel] >= RISK_RANK.high ? "high" : "medium";
            add({
              id: conflictId("conflicting_severity", higher.id, lower.id),
              category: "conflicting_severity",
              severity: sev,
              dimension: "severity / risk rating (the same event graded differently)",
              subject_kind: "child",
              subject_id: childId,
              subject_name: childName,
              event_a: refOf(higher),
              event_b: refOf(lower),
              description: `Two ${a.eventType.replace(/_/g, " ")} records for ${childName} within 12 hours describe what appears to be the same event (${Math.round(sim * 100)}% wording overlap) but grade it differently — "${higher.riskLevel}" in one and "${lower.riskLevel}" in the other. The seriousness of an event must be recorded consistently.`,
              recommended_action: "Confirm whether these are one event or two. If one, agree a single severity (defaulting to the higher pending review) and consolidate; if two, clarify the wording so they are not mistaken for the same event.",
              aria_assessment: {
                likely_accurate_event_id: higher.id,
                reasoning: "Where the same event is graded inconsistently, the higher rating should stand until a human reviews it — under-grading risk is the more dangerous error. This is precautionary, not a judgement that the higher record is correct.",
                confidence: 0.55,
              },
              status: "needs_human_review",
              auto_resolved: false,
            });
          }
        }
      }
    }
  }

  // ── Assemble & sort deterministically ────────────────────────────────────────
  const conflicts = [...found.values()].sort((x, y) => {
    if (SEVERITY_RANK[x.severity] !== SEVERITY_RANK[y.severity]) return SEVERITY_RANK[y.severity] - SEVERITY_RANK[x.severity];
    if (x.category !== y.category) return x.category < y.category ? -1 : 1;
    if (x.event_a.event_id !== y.event_a.event_id) return x.event_a.event_id < y.event_a.event_id ? -1 : 1;
    return x.event_b.event_id < y.event_b.event_id ? -1 : x.event_b.event_id > y.event_b.event_id ? 1 : 0;
  });

  const by_category: Record<string, number> = {};
  const subjects = new Set<string>();
  let critical_or_high = 0;
  for (const c of conflicts) {
    by_category[c.category] = (by_category[c.category] ?? 0) + 1;
    subjects.add(`${c.subject_kind}:${c.subject_id}`);
    if (c.severity === "critical" || c.severity === "high") critical_or_high++;
  }

  const overview: ConflictOverview = {
    total_events: input.events.length,
    conflicts_found: conflicts.length,
    critical_or_high,
    by_category,
    subjects_affected: subjects.size,
    auto_resolved: 0,
  };

  return {
    overview,
    conflicts,
    alerts: buildAlerts(conflicts),
    insights: buildInsights(overview, conflicts),
  };
}

// ── Alerts ──────────────────────────────────────────────────────────────────

function buildAlerts(conflicts: ConflictFinding[]): ConflictAlert[] {
  return conflicts
    .filter((c) => c.severity === "critical" || c.severity === "high")
    .slice(0, 8)
    .map((c) => ({
      severity: c.severity,
      message: `${labelFor(c.category)} for ${c.subject_name}: ${c.dimension.split("(")[0].trim()} — needs human reconciliation.`,
      subject_id: c.subject_id,
      category: c.category,
    }));
}

function labelFor(category: ConflictCategory): string {
  switch (category) {
    case "present_while_missing": return "Care logged during a missing episode";
    case "injury_contradiction": return "Injury recorded then denied";
    case "conflicting_severity": return "Same event graded differently";
    case "staff_unavailable_conflict": return "Working while on leave";
  }
}

// ── ARIA insights ─────────────────────────────────────────────────────────────

function buildInsights(overview: ConflictOverview, conflicts: ConflictFinding[]): AriaConflictInsight[] {
  const insights: AriaConflictInsight[] = [];

  if (overview.conflicts_found === 0) {
    insights.push({
      severity: "positive",
      text: `No internal contradictions found across ${overview.total_events} event${overview.total_events === 1 ? "" : "s"}. The record is internally consistent — where two records describe the same child, time or situation, they agree. (Whenever a conflict is found it is always surfaced for a human to reconcile and never auto-resolved.)`,
    });
    return insights;
  }

  insights.push({
    severity: overview.critical_or_high > 0 ? "critical" : "warning",
    text: `${overview.conflicts_found} conflict${overview.conflicts_found === 1 ? "" : "s"} found across ${overview.subjects_affected} subject${overview.subjects_affected === 1 ? "" : "s"} — records that describe the same situation but disagree. ${overview.critical_or_high} ${overview.critical_or_high === 1 ? "is" : "are"} high or critical. These are data-integrity (and often safeguarding) risks: an inspector reading two contradictory accounts cannot tell which is true.`,
  });

  // Safeguard transparency statement — always present when conflicts exist.
  insights.push({
    severity: "warning",
    text: `Every conflict here is flagged for human reconciliation and is never auto-resolved. ARIA may suggest which record is more likely accurate — with its reasoning and a confidence score — but it never edits either record, never hides the disagreement, and never silently picks a winner. The decision stays with a person.`,
  });

  const missing = overview.by_category["present_while_missing"] ?? 0;
  if (missing > 0) {
    insights.push({
      severity: "critical",
      text: `${missing} record${missing === 1 ? "" : "s"} place${missing === 1 ? "s" : ""} a child in care during a recorded missing episode. This is the most serious class of conflict — it undermines the missing-from-care timeline that Ofsted and the police rely on. Reconcile these first.`,
    });
  }

  const topCategory = Object.entries(overview.by_category).sort((a, b) => b[1] - a[1])[0];
  if (topCategory && topCategory[0] !== "present_while_missing") {
    insights.push({
      severity: "warning",
      text: `Most conflicts are "${labelFor(topCategory[0] as ConflictCategory).toLowerCase()}" (${topCategory[1]}). A "search before you log, then reconcile on save" prompt at the point of capture would stop most of these contradictions ever being written.`,
    });
  }

  return insights;
}
