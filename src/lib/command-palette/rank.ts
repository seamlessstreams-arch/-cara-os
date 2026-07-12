// ══════════════════════════════════════════════════════════════════════════════
// CARA — COMMAND PALETTE RANKER (pure)
//
// The global ⌘K palette searches ~900 pages, ~370 create actions and the home's
// children/staff. This module is the deterministic scoring core: no React, no
// Date, no randomness — identical input yields identical ranking, so it is
// directly unit-testable and the palette component stays thin.
//
// Scoring model (per entry, against a whole query):
//   exact label            100
//   label prefix            88
//   word-start in label     76   ("safe" → "Safe Staffing", "st" → "Shift **St**...")
//   substring in label      60
//   fuzzy subsequence       22–46 (density-scaled: "medcation" → "Medication")
//   keyword/hint hits score at 85% / 60% weight of the label equivalents.
// Multi-term queries: EVERY term must hit somewhere (label/keywords/hint);
// the entry scores by the average of its terms' best hits.
// Kind boosts keep people above pages for name-like queries; recents get a
// small position-decayed boost so "the thing I always open" floats up.
// ══════════════════════════════════════════════════════════════════════════════

export type PaletteKind = "child" | "staff" | "action" | "page";

export interface PaletteEntry {
  /** Stable id — also the recents key. */
  id: string;
  label: string;
  /** Secondary line ("Children › Care Plans", a role, …). */
  hint?: string;
  href: string;
  kind: PaletteKind;
  /** Extra matchable terms (group label, aliases). */
  keywords?: string[];
  /** lucide icon name (resolved by the component). */
  iconKey?: string;
  /** Permission module (canAccessModule) — filtering happens in the component. */
  module?: string;
}

export interface RankedEntry {
  entry: PaletteEntry;
  score: number;
}

const KIND_BOOST: Record<PaletteKind, number> = {
  child: 8, // people are the most common lookup in a home
  staff: 5,
  action: 4, // "log an incident" should beat the incidents page listing
  page: 0,
};

/** Score one term against one text. 0 = no match. Pure. */
export function matchScore(term: string, text: string): number {
  const t = term.toLowerCase();
  const s = text.toLowerCase();
  if (!t || !s) return 0;
  if (s === t) return 100;
  if (s.startsWith(t)) return 88;
  // word-start: a word boundary immediately before the match
  const wordStart = s.split(/[\s/›&(-]+/).some((w) => w.startsWith(t));
  if (wordStart) return 76;
  if (s.includes(t)) return 60;
  // fuzzy subsequence, density-scaled: all chars of t appear in order in s.
  let i = 0;
  let firstHit = -1;
  let lastHit = -1;
  for (let j = 0; j < s.length && i < t.length; j++) {
    if (s[j] === t[i]) {
      if (firstHit < 0) firstHit = j;
      lastHit = j;
      i++;
    }
  }
  if (i < t.length) return 0;
  const span = lastHit - firstHit + 1;
  const density = t.length / span; // 1 = contiguous
  return Math.round(22 + 24 * Math.min(1, density));
}

/** Best score for a term across an entry's label / keywords / hint. */
function termScore(term: string, entry: PaletteEntry): number {
  let best = matchScore(term, entry.label);
  for (const kw of entry.keywords ?? []) {
    best = Math.max(best, Math.round(matchScore(term, kw) * 0.85));
  }
  if (entry.hint) {
    best = Math.max(best, Math.round(matchScore(term, entry.hint) * 0.6));
  }
  return best;
}

/** Position-decayed recency boost: most recent = +14, tailing off. */
function recencyBoost(id: string, recents: readonly string[]): number {
  const pos = recents.indexOf(id);
  if (pos < 0) return 0;
  return Math.max(0, 14 - pos * 3);
}

/**
 * Rank entries for a query. Deterministic: score desc, then label asc, then id.
 * Empty/whitespace query returns [] — the component shows recents/defaults.
 */
export function rankEntries(
  entries: readonly PaletteEntry[],
  query: string,
  opts: { recents?: readonly string[]; limit?: number } = {},
): RankedEntry[] {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  const recents = opts.recents ?? [];
  const limit = opts.limit ?? 14;

  const ranked: RankedEntry[] = [];
  for (const entry of entries) {
    let total = 0;
    let allHit = true;
    for (const term of terms) {
      const s = termScore(term, entry);
      if (s === 0) {
        allHit = false;
        break;
      }
      total += s;
    }
    if (!allHit) continue;
    const score = Math.round(total / terms.length) + KIND_BOOST[entry.kind] + recencyBoost(entry.id, recents);
    ranked.push({ entry, score });
  }

  ranked.sort(
    (a, b) =>
      b.score - a.score ||
      a.entry.label.localeCompare(b.entry.label) ||
      a.entry.id.localeCompare(b.entry.id),
  );
  return ranked.slice(0, limit);
}

/**
 * The empty-query view: recent entries (in recency order) followed by a stable
 * set of starter suggestions, deduped, capped.
 */
export function emptyQueryEntries(
  entries: readonly PaletteEntry[],
  recents: readonly string[],
  limit = 12,
): PaletteEntry[] {
  const byId = new Map(entries.map((e) => [e.id, e]));
  const out: PaletteEntry[] = [];
  const seen = new Set<string>();
  for (const id of recents) {
    const e = byId.get(id);
    if (e && !seen.has(e.id)) {
      out.push(e);
      seen.add(e.id);
    }
    if (out.length >= limit) return out;
  }
  // Starters: children first, then actions, then pages — stable input order.
  for (const kind of ["child", "action", "page"] as const) {
    for (const e of entries) {
      if (e.kind !== kind || seen.has(e.id)) continue;
      out.push(e);
      seen.add(e.id);
      if (out.length >= limit) return out;
    }
  }
  return out;
}
