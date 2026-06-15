// ══════════════════════════════════════════════════════════════════════════════
// CARA WRITING ASSISTANT — redaction
//
// Strips children's / staff personal data (names, DOBs, phones, emails,
// postcodes) before any text could be sent to an EXTERNAL provider. The default
// deterministic engine runs server-side on raw text and needs no redaction; this
// utility exists so external checking can never leak identifying data.
//
// Placeholders are unique, word-like tokens so grammar context is preserved and
// the original can be rehydrated exactly. Pure + deterministic.
// ══════════════════════════════════════════════════════════════════════════════

export interface RedactionEntry {
  placeholder: string;
  original: string;
}
export interface RedactionResult {
  redacted: string;
  map: RedactionEntry[];
}

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
// UK mobile/landline + international, loosely.
const PHONE_RE = /(?:\+?44\s?|0)(?:\d\s?){9,10}\d/g;
// UK postcode.
const POSTCODE_RE = /\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/gi;
// dd/mm/yyyy or dd-mm-yyyy or "1 January 2012".
const DATE_RE =
  /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b/gi;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Redact identifying data. Order matters (emails/phones/postcodes/dates before
 * names, so a name inside an email is removed with the email). `names` are known
 * names from context (child + staff) — redacted whole-word, longest first.
 */
export function redact(text: string, opts: { names?: string[] } = {}): RedactionResult {
  const map: RedactionEntry[] = [];
  let counter = 0;
  const place = (category: string, original: string): string => {
    // Reuse the same placeholder for an identical original so rehydration is stable.
    const existing = map.find((e) => e.original === original);
    if (existing) return existing.placeholder;
    counter += 1;
    const placeholder = `__${category}_${counter}__`;
    map.push({ placeholder, original });
    return placeholder;
  };

  let out = text;
  out = out.replace(EMAIL_RE, (m) => place("EMAIL", m));
  out = out.replace(PHONE_RE, (m) => place("PHONE", m));
  out = out.replace(POSTCODE_RE, (m) => place("POSTCODE", m));
  out = out.replace(DATE_RE, (m) => place("DATE", m));

  const names = (opts.names ?? [])
    .map((n) => n.trim())
    .filter((n) => n.length >= 2)
    .sort((a, b) => b.length - a.length); // longest first
  for (const name of names) {
    const re = new RegExp(`\\b${escapeRe(name)}\\b`, "g");
    out = out.replace(re, (m) => place("NAME", m));
  }

  return { redacted: out, map };
}

/** Restore the original values from a redaction map. */
export function rehydrate(text: string, map: RedactionEntry[]): string {
  let out = text;
  for (const { placeholder, original } of map) {
    out = out.split(placeholder).join(original);
  }
  return out;
}

/** True if the text still contains any redaction placeholder (e.g. a provider mangled one). */
export function hasUnresolvedPlaceholders(text: string): boolean {
  return /__(?:EMAIL|PHONE|POSTCODE|DATE|NAME)_\d+__/.test(text);
}
