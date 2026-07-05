// ══════════════════════════════════════════════════════════════════════════════
// CARA — ENTITY-STABLE REDACTION (pure engine)
//
// buildCodebook(entities) assigns deterministic, stable codes (Child A, Staff 1).
// redactText / redactDocuments apply the codebook so the same person reads as the
// same code across a whole document set. rehydrateText reverses it for an
// authorised viewer. Word-boundary matching, longest-term-first, with a safety
// rule for shared first names (redacted to a generic placeholder, never
// mis-attributed to one child).
//
// Pure + deterministic — no store, no model, no time/randomness.
// ══════════════════════════════════════════════════════════════════════════════

import {
  ENTITY_REDACTION_VERSION,
  type Codebook,
  type CodebookEntry,
  type EntityKind,
  type EntityRef,
  type RedactableDocument,
  type RedactionOutcome,
} from "./types";

const KIND_GENERIC: Record<EntityKind, string> = { child: "a child", staff: "a staff member" };

/** Spreadsheet-column letters: 0→A, 25→Z, 26→AA … (deterministic, unbounded). */
function letterCode(index: number): string {
  let n = index;
  let out = "";
  do {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return out;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Replace whole-word occurrences of `term` (case-insensitive), treating letters
 *  and digits as word characters so "Alex" never matches inside "Alexander". */
function replaceWholeWord(text: string, term: string, replacement: string): string {
  if (!term.trim()) return text;
  const re = new RegExp(`(?<![A-Za-z0-9])${escapeRe(term)}(?![A-Za-z0-9])`, "gi");
  return text.replace(re, replacement);
}

const firstToken = (name: string): string => name.trim().split(/\s+/)[0] ?? "";
const lastToken = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : "";
};

export function buildCodebook(entities: EntityRef[]): Codebook {
  // Deterministic ordering: by kind, then id.
  const children = entities.filter((e) => e.kind === "child").sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const staff = entities.filter((e) => e.kind === "staff").sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  // Which single-name tokens are unique across the WHOLE set (per kind)? A first
  // or last name shared by 2+ people can't be safely attributed to one code.
  const tokenCounts = new Map<string, number>();
  const bump = (t: string) => {
    const k = t.toLowerCase();
    if (k) tokenCounts.set(k, (tokenCounts.get(k) ?? 0) + 1);
  };
  for (const e of entities) {
    bump(firstToken(e.name));
    bump(lastToken(e.name));
  }
  const isUnique = (t: string) => t && tokenCounts.get(t.toLowerCase()) === 1;

  const build = (list: EntityRef[], codeFor: (i: number) => string): CodebookEntry[] =>
    list.map((e, i) => {
      const terms = new Set<string>([e.name, ...(e.aliases ?? [])]);
      const fn = firstToken(e.name);
      const ln = lastToken(e.name);
      if (isUnique(fn)) terms.add(fn);
      if (isUnique(ln)) terms.add(ln);
      // Longest first so "Alex Smith" is redacted before a bare "Alex".
      const matchTerms = [...terms].filter(Boolean).sort((a, b) => b.length - a.length);
      return { id: e.id, kind: e.kind, name: e.name, code: codeFor(i), matchTerms };
    });

  const entries: CodebookEntry[] = [
    ...build(children, (i) => `Child ${letterCode(i)}`),
    ...build(staff, (i) => `Staff ${i + 1}`),
  ];

  return { entries, version: ENTITY_REDACTION_VERSION };
}

export function redactText(text: string, codebook: Codebook): string {
  if (!text) return text;

  // 1) Replace every entity match-term with its code, longest term first across
  //    the whole set (so full names go before first names).
  const replacements: { term: string; code: string }[] = [];
  for (const e of codebook.entries) for (const t of e.matchTerms) replacements.push({ term: t, code: e.code });
  replacements.sort((a, b) => b.term.length - a.term.length);

  let out = text;
  for (const { term, code } of replacements) out = replaceWholeWord(out, term, code);

  // 2) Shared first names that were NOT assigned to a single code still leak a
  //    real name. Redact them to a generic placeholder — never guess a code.
  const assigned = new Set<string>();
  for (const e of codebook.entries) for (const t of e.matchTerms) assigned.add(t.toLowerCase());
  const shared = new Map<string, EntityKind>();
  const seen = new Map<string, EntityKind>();
  for (const e of codebook.entries) {
    const fn = firstToken(e.name);
    if (!fn) continue;
    const k = fn.toLowerCase();
    if (assigned.has(k)) continue; // already handled (unique)
    if (seen.has(k)) shared.set(k, e.kind);
    else seen.set(k, e.kind);
  }
  for (const e of codebook.entries) {
    const fn = firstToken(e.name);
    const k = fn.toLowerCase();
    if (shared.has(k)) out = replaceWholeWord(out, fn, KIND_GENERIC[shared.get(k)!]);
  }

  return out;
}

export function redactDocuments(documents: RedactableDocument[], codebook: Codebook): RedactableDocument[] {
  return documents.map((d) => ({ id: d.id, text: redactText(d.text, codebook) }));
}

/** Reverse redaction for an authorised viewer. Codes are distinctive; longest
 *  code first so "Child A" never rehydrates the "Child A" inside "Child AB". */
export function rehydrateText(text: string, codebook: Codebook): string {
  if (!text) return text;
  const byCodeLen = [...codebook.entries].sort((a, b) => b.code.length - a.code.length);
  let out = text;
  for (const e of byCodeLen) out = replaceWholeWord(out, e.code, e.name);
  return out;
}

/** QA: which known names still appear after redaction (should be empty). */
export function findResidualNames(text: string, codebook: Codebook): string[] {
  const hits: string[] = [];
  for (const e of codebook.entries) {
    for (const t of e.matchTerms) {
      if (new RegExp(`(?<![A-Za-z0-9])${escapeRe(t)}(?![A-Za-z0-9])`, "i").test(text)) {
        hits.push(t);
        break;
      }
    }
  }
  return hits;
}

export function redactDocumentSet(documents: RedactableDocument[], entities: EntityRef[]): RedactionOutcome {
  const codebook = buildCodebook(entities);
  const redacted = redactDocuments(documents, codebook);
  const residualNames = redacted
    .map((d) => ({ documentId: d.id, names: findResidualNames(d.text, codebook) }))
    .filter((r) => r.names.length > 0);
  return { codebook, documents: redacted, residualNames };
}

export { ENTITY_REDACTION_VERSION };
