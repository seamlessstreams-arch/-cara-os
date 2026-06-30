// ─────────────────────────────────────────────────────────────────────────────
// Word-boundaried keyword matching
//
// Free-text scanners in the engines repeatedly used `text.includes("word")` or
// `/word/i.test(text)`, which match SUBSTRINGS — so "older" matched "folder",
// "harm" matched "pharmacy", "mate" matched "climate", "man" matched
// "management". That produced false safeguarding flags (and false negatives that
// suppressed practice prompts). These helpers match whole words instead.
//
// A single token also matches its simple plural ("mate" → "mates"); multi-word
// phrases match literally. Case-insensitive. No external deps.
// ─────────────────────────────────────────────────────────────────────────────

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** True if `text` mentions ANY of `words` as a whole word (not a substring). */
export function mentionsAny(text: string | null | undefined, words: string[]): boolean {
  if (!text) return false;
  return words.some((raw) => {
    const w = raw.trim();
    if (!w) return false;
    const esc = escapeRe(w);
    // single token → allow an optional plural "s"; phrase → match literally
    const body = /\s/.test(w) ? esc : `${esc}s?`;
    return new RegExp(`\\b${body}\\b`, "i").test(text);
  });
}

/** True if `text` mentions `word` as a whole word (not a substring). */
export function mentions(text: string | null | undefined, word: string): boolean {
  return mentionsAny(text, [word]);
}
