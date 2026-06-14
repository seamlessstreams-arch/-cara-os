// ══════════════════════════════════════════════════════════════════════════════
// CARA — DUPLICATE DETECTION ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls, and NO
// argless current-time calls. Accepts an injectable `today` (yyyy-mm-dd).
//
// The direct embodiment of the core rule: "capture once, link intelligently,
// surface everywhere, NEVER DUPLICATE". It scans the canonical CornerstoneEvent
// stream for likely duplicate records — the same kind of event, about the same
// child, logged within 48 hours, with near-identical wording — and surfaces them
// so staff link to the existing record instead of creating a second one.
//
// Matching rule (a suspected duplicate pair requires ALL of):
//   1. same eventType
//   2. same childId (both present)
//   3. occurredAt within 48 hours of each other
//   4. high summary similarity — token overlap (Jaccard) >= threshold
//
// Tuning: routine recurring records (daily_log especially) are NOT flagged unless
// the wording is genuinely near-identical, so legitimate repeated logging is never
// mistaken for a duplicate. Per-type thresholds raise the bar for those.
// ══════════════════════════════════════════════════════════════════════════════

import type { CornerstoneEvent } from "@/types/cornerstone-event";

// ── Output types ────────────────────────────────────────────────────────────

export interface SuspectedDuplicate {
  primary_event_id: string;
  duplicate_event_id: string;
  event_type: string;
  child_id: string;
  child_name: string;
  /** 0–1 similarity score (Jaccard token overlap of the two summaries). */
  similarity: number;
  reason: string;
  suggested_action: "Link to the existing event instead of creating a duplicate";
}

export interface DuplicateOverview {
  total_events: number;
  suspected_duplicates: number;
  clusters: number;
}

export interface DuplicateAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  child_id?: string;
  event_type?: string;
}

export interface CaraDuplicateInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

/** A connected group of events that are mutually suspected duplicates. */
export interface DuplicateCluster {
  event_type: string;
  child_id: string;
  child_name: string;
  event_ids: string[];
  size: number;
}

export interface DuplicateDetectionResult {
  overview: DuplicateOverview;
  duplicates: SuspectedDuplicate[];
  clusters: DuplicateCluster[];
  alerts: DuplicateAlert[];
  insights: CaraDuplicateInsight[];
}

// ── Input ─────────────────────────────────────────────────────────────────────

export interface ChildRef {
  id: string;
  first_name?: string;
  last_name?: string;
  preferred_name?: string | null;
}

export interface DuplicateDetectionInput {
  events: CornerstoneEvent[];
  /** Optional child directory for resolving names; falls back to the id. */
  children?: ChildRef[];
  /** Injectable current date (yyyy-mm-dd); defaults to the current ISO date. */
  today?: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

const HOURS_48_MS = 48 * 60 * 60 * 1000;

/** Generic similarity bar for a suspected duplicate. */
const DEFAULT_THRESHOLD = 0.6;

/**
 * Per-type thresholds. Routine, legitimately-recurring records demand a much
 * higher bar so normal repeated logging (a daily log every day) is never flagged
 * unless the wording is genuinely near-identical.
 */
const TYPE_THRESHOLD: Record<string, number> = {
  daily_log: 0.85,
  keywork: 0.8,
  supervision: 0.8,
  education: 0.75,
  health: 0.75,
};

function thresholdFor(eventType: string): number {
  return TYPE_THRESHOLD[eventType] ?? DEFAULT_THRESHOLD;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** A small set of common words stripped before comparison, to focus on content. */
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "at", "for", "with",
  "is", "was", "were", "are", "be", "been", "by", "as", "it", "this", "that",
  "he", "she", "they", "him", "her", "his", "their", "we", "i", "you",
]);

/** Normalise a summary into a set of lowercase content tokens (deterministic). */
export function tokenize(summary: string): Set<string> {
  const tokens = (summary ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ") // drop punctuation
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
  return new Set(tokens);
}

/** Jaccard similarity of two token sets: |A ∩ B| / |A ∪ B|. Range 0–1. */
export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection++;
  const union = a.size + b.size - intersection;
  if (union === 0) return 0;
  return intersection / union;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Parse an event's occurredAt into epoch ms; NaN if unparseable. */
function toMs(iso: string): number {
  return new Date(iso).getTime();
}

function resolveChildName(childId: string, byId: Map<string, ChildRef>): string {
  const c = byId.get(childId);
  if (!c) return childId;
  const full = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
  return c.preferred_name || full || childId;
}

// ── Union-Find (for clustering mutually-duplicate events) ──────────────────────

class UnionFind {
  private parent = new Map<string, string>();

  find(x: string): string {
    if (!this.parent.has(x)) this.parent.set(x, x);
    let root = this.parent.get(x)!;
    while (root !== this.parent.get(root)) {
      root = this.parent.get(root)!;
    }
    // Path compression.
    let cur = x;
    while (cur !== root) {
      const next = this.parent.get(cur)!;
      this.parent.set(cur, root);
      cur = next;
    }
    return root;
  }

  union(a: string, b: string): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return;
    // Deterministic root choice: smaller id wins, so output never depends on order.
    if (ra < rb) this.parent.set(rb, ra);
    else this.parent.set(ra, rb);
  }
}

// ── Main computation ───────────────────────────────────────────────────────

export function computeDuplicateDetection(
  input: DuplicateDetectionInput,
): DuplicateDetectionResult {
  const _today = input.today ?? new Date().toISOString().slice(0, 10);
  void _today; // reserved for future recency weighting; kept for determinism contract.

  const byId = new Map<string, ChildRef>();
  for (const c of input.children ?? []) byId.set(c.id, c);

  // Only events with a child and a parseable timestamp can pair up.
  const candidates = input.events
    .filter((e) => !!e.childId && Number.isFinite(toMs(e.occurredAt)))
    .map((e) => ({ event: e, ms: toMs(e.occurredAt), tokens: tokenize(e.summary) }));

  // Deterministic ordering: by occurredAt, then id. Independent of input order.
  candidates.sort((a, b) => {
    if (a.ms !== b.ms) return a.ms - b.ms;
    return a.event.id < b.event.id ? -1 : a.event.id > b.event.id ? 1 : 0;
  });

  // Bucket by (eventType + childId) so we only compare like-for-like.
  const buckets = new Map<string, typeof candidates>();
  for (const c of candidates) {
    const key = `${c.event.eventType}::${c.event.childId}`;
    const arr = buckets.get(key);
    if (arr) arr.push(c);
    else buckets.set(key, [c]);
  }

  const duplicates: SuspectedDuplicate[] = [];
  const uf = new UnionFind();

  // Compare within each bucket; the bucket is already time-sorted.
  for (const arr of buckets.values()) {
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i];
        const b = arr[j];
        // Time window: as soon as b is beyond 48h of a, every later j is too.
        if (b.ms - a.ms > HOURS_48_MS) break;

        const sim = jaccard(a.tokens, b.tokens);
        const threshold = thresholdFor(a.event.eventType);
        if (sim < threshold) continue;

        // a is earlier (or tie-broken by id) → treat as the primary/original.
        const hoursApart = Math.round(((b.ms - a.ms) / (60 * 60 * 1000)) * 10) / 10;
        const childName = resolveChildName(a.event.childId!, byId);
        duplicates.push({
          primary_event_id: a.event.id,
          duplicate_event_id: b.event.id,
          event_type: a.event.eventType,
          child_id: a.event.childId!,
          child_name: childName,
          similarity: round2(sim),
          reason: buildReason(a.event.eventType, sim, hoursApart),
          suggested_action: "Link to the existing event instead of creating a duplicate",
        });
        uf.union(a.event.id, b.event.id);
      }
    }
  }

  const clusters = buildClusters(duplicates, byId);
  const overview: DuplicateOverview = {
    total_events: input.events.length,
    suspected_duplicates: duplicates.length,
    clusters: clusters.length,
  };
  const alerts = buildAlerts(clusters);
  const insights = buildInsights(overview, duplicates, clusters);

  return { overview, duplicates, clusters, alerts, insights };
}

// ── Reason text ───────────────────────────────────────────────────────────────

function buildReason(eventType: string, sim: number, hoursApart: number): string {
  const pct = Math.round(sim * 100);
  const typeLabel = eventType.replace(/_/g, " ");
  const when =
    hoursApart < 1
      ? "within the hour"
      : `${hoursApart} hour${hoursApart === 1 ? "" : "s"} apart`;
  return `Two ${typeLabel} records for the same child, ${when}, with ${pct}% wording overlap — likely the same event logged twice.`;
}

// ── Clustering ──────────────────────────────────────────────────────────────

function buildClusters(
  duplicates: SuspectedDuplicate[],
  byId: Map<string, ChildRef>,
): DuplicateCluster[] {
  // Rebuild groups from the duplicate pairs deterministically.
  const uf = new UnionFind();
  for (const d of duplicates) uf.union(d.primary_event_id, d.duplicate_event_id);

  // Map each event id to its cluster root, capturing type + child from the pair.
  const meta = new Map<string, { event_type: string; child_id: string }>();
  for (const d of duplicates) {
    if (!meta.has(d.primary_event_id)) meta.set(d.primary_event_id, { event_type: d.event_type, child_id: d.child_id });
    if (!meta.has(d.duplicate_event_id)) meta.set(d.duplicate_event_id, { event_type: d.event_type, child_id: d.child_id });
  }

  const groups = new Map<string, Set<string>>();
  for (const id of meta.keys()) {
    const root = uf.find(id);
    const set = groups.get(root);
    if (set) set.add(id);
    else groups.set(root, new Set([id]));
  }

  const clusters: DuplicateCluster[] = [];
  for (const set of groups.values()) {
    const ids = [...set].sort();
    const first = meta.get(ids[0])!;
    clusters.push({
      event_type: first.event_type,
      child_id: first.child_id,
      child_name: resolveChildName(first.child_id, byId),
      event_ids: ids,
      size: ids.length,
    });
  }

  // Largest clusters first, then by child id for stable ordering.
  clusters.sort((a, b) => {
    if (a.size !== b.size) return b.size - a.size;
    if (a.child_id !== b.child_id) return a.child_id < b.child_id ? -1 : 1;
    return a.event_type < b.event_type ? -1 : a.event_type > b.event_type ? 1 : 0;
  });
  return clusters;
}

// ── Alerts ──────────────────────────────────────────────────────────────────

function buildAlerts(clusters: DuplicateCluster[]): DuplicateAlert[] {
  const alerts: DuplicateAlert[] = [];
  // Clusters of >= 3 events are a strong signal of repeated double-logging.
  for (const c of clusters.filter((c) => c.size >= 3)) {
    alerts.push({
      severity: c.size >= 5 ? "high" : "medium",
      message: `${c.size} near-identical ${c.event_type.replace(/_/g, " ")} records for ${c.child_name} look like the same event captured repeatedly — consolidate into one and link the rest.`,
      child_id: c.child_id,
      event_type: c.event_type,
    });
  }
  return alerts;
}

// ── Cara insights ─────────────────────────────────────────────────────────────

function buildInsights(
  overview: DuplicateOverview,
  duplicates: SuspectedDuplicate[],
  clusters: DuplicateCluster[],
): CaraDuplicateInsight[] {
  const insights: CaraDuplicateInsight[] = [];

  if (overview.suspected_duplicates === 0) {
    insights.push({
      severity: "positive",
      text: `No likely duplicates across ${overview.total_events} event${overview.total_events === 1 ? "" : "s"}. Capture-once is holding: each event exists in one place and is linked wherever it is needed, so the record stays clean and trustworthy.`,
    });
    return insights;
  }

  insights.push({
    severity: "warning",
    text: `${overview.suspected_duplicates} suspected duplicate pair${overview.suspected_duplicates === 1 ? "" : "s"} found. Each is the same kind of event, about the same child, logged within 48 hours with near-identical wording. Linking to the original instead of re-recording keeps one true timeline — capture once, surface everywhere, never duplicate.`,
  });

  // Where is the duplication concentrated?
  const typeCounts: Record<string, number> = {};
  for (const d of duplicates) typeCounts[d.event_type] = (typeCounts[d.event_type] ?? 0) + 1;
  const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
  if (topType) {
    insights.push({
      severity: "warning",
      text: `Most duplication is in ${topType[0].replace(/_/g, " ")} records (${topType[1]} pair${topType[1] === 1 ? "" : "s"}). A quick "search before you log" prompt here would stop the second copy being created and save staff re-keying the same information.`,
    });
  }

  const bigClusters = clusters.filter((c) => c.size >= 3);
  if (bigClusters.length > 0) {
    insights.push({
      severity: "critical",
      text: `${bigClusters.length} cluster${bigClusters.length === 1 ? "" : "s"} of 3 or more near-identical records detected — the strongest sign of repeated double-logging. Consolidating these protects the audit trail: Ofsted sees one clear account, not several conflicting copies of the same event.`,
    });
  }

  return insights;
}
