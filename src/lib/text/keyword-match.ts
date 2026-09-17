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

// ─────────────────────────────────────────────────────────────────────────────
// Negation-aware STEM matching
//
// Some scanners deliberately match a stem so one keyword catches its variants —
// "exploit" → exploitation / exploited / exploiting. A whole-word matcher can't
// do that, and a raw `.includes("exploit")` has two flaws: it matches mid-word
// ("...") AND it fires inside a negated clause ("no exploitation concerns",
// "denied being groomed") — a FALSE safeguarding/risk flag. These helpers match
// each stem at a WORD START (so any suffix counts, but not a mid-word substring)
// and drop occurrences that are negated within their own clause.
// ─────────────────────────────────────────────────────────────────────────────

// Conservative, clause-local negation cues (mirrors care-language-audit's proven
// set): a straight/curly "…n't", or a bare no/not/never/without/denies/denied/
// cannot/nil/none. Kept small so it suppresses clear denials, not everything.
const NEGATION_RE = /\b(?:no|not|never|without|denies|denied|cannot|nil|none)\b|n['’]t\b/;

// Only a SHORT window before the match counts as negating it. Genuine adjacent
// denials cluster tight ("no exploitation" = 3 chars, "no signs of exploitation"
// = 12, "denied being groomed" = 13, "no concerns about grooming" = 18); a longer
// reach starts swallowing real signals behind a communication verb ("wouldn't
// discuss the older man" = 21). For safeguarding a wrongful SUPPRESSION is the
// dangerous error (it hides a risk), so we bias to flag: suppress only tight
// denials, leave looser constructions raised.
const NEGATION_WINDOW = 18;

/**
 * Is the match at `idx` negated within its own clause? Looks only a short window
 * back and stops at the nearest clause boundary (.,;:!?), so a denial in an
 * EARLIER clause ("he was calm; staff noted exploitation") can't wrongly suppress
 * a real hit in the next.
 */
function negatedInClause(lower: string, idx: number): boolean {
  let preceding = lower.slice(Math.max(0, idx - NEGATION_WINDOW), idx);
  const stop = Math.max(
    preceding.lastIndexOf("."), preceding.lastIndexOf("!"), preceding.lastIndexOf("?"),
    preceding.lastIndexOf(";"), preceding.lastIndexOf(":"), preceding.lastIndexOf(","),
  );
  if (stop >= 0) preceding = preceding.slice(stop + 1);
  return NEGATION_RE.test(preceding);
}

/**
 * Core: does any keyword occur UN-negated? `mode` picks the boundary rule —
 * "word" mirrors `mentionsAny` (whole word, optional plural on single tokens),
 * "stem" matches at a word start so any suffix counts ("exploit"→"exploitation").
 */
function anyUnnegated(text: string, words: string[], mode: "word" | "stem"): boolean {
  const lower = text.toLowerCase();
  for (const raw of words) {
    const w = raw.trim().toLowerCase();
    if (!w) continue;
    const esc = escapeRe(w);
    // "word": whole word (single token also matches its plural). "stem": word start.
    const body = mode === "stem" ? esc : /\s/.test(w) ? esc : `${esc}s?`;
    const tail = mode === "stem" ? "" : "\\b";
    const re = new RegExp(`\\b${body}${tail}`, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(lower)) !== null) {
      if (!negatedInClause(lower, m.index)) return true;
      if (re.lastIndex === m.index) re.lastIndex++; // guard against zero-width
    }
  }
  return false;
}

/**
 * Whole-word sibling of `mentionsAny` that ignores matches negated within their
 * own clause — so "no unknown adults" / "denies older males" don't raise a flag,
 * but keeps whole-word discipline ("older" never matches "folder"). Use for
 * safeguarding keywords that must stay whole words.
 */
export function mentionsAnyUnnegated(text: string | null | undefined, words: string[]): boolean {
  if (!text) return false;
  return anyUnnegated(text, words, "word");
}

/**
 * Stem match (word start, any suffix, so "exploit" matches "exploitation" /
 * "exploited") that ignores matches negated within their own clause — "no
 * exploitation" / "denied being groomed" don't raise the flag. Use for the
 * free-text risk scanners that deliberately match a stem, replacing a raw
 * `.includes("exploit")` that was both mid-word-prone and negation-blind.
 */
export function mentionsAnyStemUnnegated(text: string | null | undefined, stems: string[]): boolean {
  if (!text) return false;
  return anyUnnegated(text, stems, "stem");
}
