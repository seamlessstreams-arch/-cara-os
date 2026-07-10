// ══════════════════════════════════════════════════════════════════════════════
// Ask CARA — UNIVERSAL RECORD CATALOGUE (pure)
//
// Ask CARA must be able to reach the COMPLETE application, not only the
// collections that have a hand-wired skill. This module introspects the live
// store at runtime — every array collection (556 at last count, 93 child-linked),
// current AND future (a new collection is covered automatically) — and distils a
// compact, tier-scoped catalogue the engine can search and narrate:
//
//   · skillRecordLookup answers "any chronology entries for Alex?" /
//     "when was the last welfare check?" for ANY collection, honestly labelled
//     as a general record read (the specialist engines still win routing).
//   · The LLM grounding pack carries the record index, so the model knows the
//     application's full surface.
//
// Heuristics, not per-collection code: child link = child_id/childId; the date
// and title fields are picked from common names; management-sensitive
// collections (staff files, HR, finance, governance) are tier-gated. Data
// minimisation: counts, dates and clipped titles — never narrative dumps.
// ══════════════════════════════════════════════════════════════════════════════

import type { getStore } from "@/lib/db/store";
import type { AccessTier, AskCaraCatalogueEntry } from "./types";

type Store = ReturnType<typeof getStore>;
type Rec = Record<string, unknown>;

const s = (v: unknown): string => (typeof v === "string" ? v : "");

const DATE_FIELDS = ["date", "created_at", "recorded_at", "occurred_at", "start", "start_date", "session_date", "entry_date", "check_date", "visit_date", "review_date", "reported_at", "due_date", "updated_at"];
const TITLE_FIELDS = ["title", "name", "summary", "label", "course_name", "check_type", "action", "category", "type", "description", "content", "notes", "feedback", "reason"];

// Management-sensitive collections — staff files, HR, workforce, finance,
// governance. Safe-side: ambiguous staff/finance keys gate to management.
// NOTE: stems take \w* (vacanc\w* matches "vacancies") — a bare \b after a stem
// never matches its inflections (the classic keyword-match trap).
const MGMT_RE = /\b(staff|supervis\w*|training|recruit\w*|dbs|vacanc\w*|candidate\w*|payroll|hr|sickness|leave|appraisal\w*|wellbeing|audit\w*|governance|complaint\w*|allegation\w*|whistle\w*|wb|disciplin\w*|grievance|capability|probation|agency|budget\w*|finance\w*|petty|invoice\w*|expense\w*|pension\w*|insuranc\w*|contract\w*|employ\w*|cpd|competenc\w*|induction\w*|qualif\w*|absence\w*|holiday\w*|bank\w*|board|hq|organisation\w*|org)\b/;

/** camelCase / snake_case store key → readable label ("sanctionsRewards" → "sanctions rewards"). */
export function labelOf(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .toLowerCase()
    .trim();
}

function pickDate(r: Rec): string | undefined {
  for (const f of DATE_FIELDS) {
    const v = s(r[f]).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  }
  return undefined;
}

function pickTitle(r: Rec): string {
  for (const f of TITLE_FIELDS) {
    const v = s(r[f]).trim();
    if (v) return (v.length > 90 ? v.slice(0, 90).replace(/\s+\S*$/, "") + "…" : v).replace(/\s+/g, " ");
  }
  return s(r.id) || "(entry)";
}

const childIdOf = (r: Rec): string | undefined => s(r.child_id) || s(r.childId) || undefined;

/** Introspect every array collection on the store into catalogue entries. */
export function buildRecordCatalogue(store: Store): AskCaraCatalogueEntry[] {
  const st = store as unknown as Record<string, unknown>;
  const out: AskCaraCatalogueEntry[] = [];
  for (const [key, value] of Object.entries(st)) {
    if (!Array.isArray(value)) continue;
    const rows = value.filter((r): r is Rec => !!r && typeof r === "object");
    const label = labelOf(key);
    const tier: AccessTier = MGMT_RE.test(label) ? "management" : "care_team";
    const childLinked = rows.some((r) => childIdOf(r));
    const childCounts: Record<string, number> = {};
    if (childLinked) {
      for (const r of rows) {
        const cid = childIdOf(r);
        if (cid) childCounts[cid] = (childCounts[cid] ?? 0) + 1;
      }
    }
    const dated = rows
      .map((r) => ({ r, date: pickDate(r) }))
      .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
    const recent = dated.slice(-5).map((x) => ({ date: x.date, childId: childIdOf(x.r), title: pickTitle(x.r) }));
    out.push({
      key,
      label,
      tier,
      count: rows.length,
      childLinked,
      childCounts: childLinked ? childCounts : undefined,
      latestDate: dated.length ? dated[dated.length - 1].date : undefined,
      recent,
    });
  }
  return out;
}

// ── Search ────────────────────────────────────────────────────────────────────

const GENERIC = new Set(["record", "records", "recorded", "have", "has", "does", "show", "list", "many", "much", "what", "when", "any", "the", "for", "this", "that", "week", "month", "year", "today", "recent", "recently", "last", "latest", "entries", "entry", "there", "with", "about", "been", "was", "were", "are", "his", "her", "their", "them"]);

const singular = (w: string): string => (w.endsWith("s") && w.length > 4 ? w.slice(0, -1) : w);

/** Fuzzy-match a question against catalogue labels. Strong-noun matches only. */
export function searchCatalogue(question: string, entries: AskCaraCatalogueEntry[]): AskCaraCatalogueEntry[] {
  const q = question.toLowerCase();
  const tokens = [...new Set(q.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length >= 4 && !GENERIC.has(w)).map(singular))];
  if (!tokens.length) return [];
  const scored = entries
    .map((e) => {
      const labelWords = new Set(e.label.split(/\s+/).map(singular));
      let score = 0;
      for (const t of tokens) if (labelWords.has(t)) score += 2;
      if (e.label.split(/\s+/).length >= 2 && q.includes(e.label)) score += 5; // full label present
      return { e, score };
    })
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score || b.e.count - a.e.count);
  return scored.slice(0, 3).map((x) => x.e);
}
