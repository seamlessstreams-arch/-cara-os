// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO — free-text normalisation for generated prose
//
// Staff type themes, aims and context notes as free text: lowercase starts,
// trailing full-stops, the first-person pronoun as "i". The deterministic
// generators interpolate those strings straight into child- and
// practitioner-facing output, so a seeded theme like
//   "What happens in my body when I get angry"
// must survive embedding without the standalone "I" being flattened to "i"
// (which `theme.toLowerCase()` did), and a messy aim must read as a clean
// sentence rather than being echoed verbatim. This module is the single place
// that cleaning happens so every generator stays consistent.
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Restore the English first-person pronoun. Matches a standalone "i" (and its
 * contractions, e.g. "i'm", "i'll") bounded by whitespace or string ends, so
 * it leaves "i.e." and list markers like "i)" alone.
 */
export function fixPersonalI(s: string): string {
  // Capitalise a standalone "i" (and contractions like i'm); the lookahead
  // allows a trailing straight or curly apostrophe. Uses string concat rather
  // than a template so the file carries no interpolation syntax at all.
  return s.replace(/(^|\s)i(?=\s|$|['’])/g, (_m, lead: string) => lead + "I");
}

/** Trim, collapse internal whitespace, and restore the first-person pronoun. */
export function tidy(s: string | null | undefined): string {
  return fixPersonalI(String(s ?? "").replace(/\s+/g, " ").trim());
}

/**
 * A clean sentence lead for a standalone fragment (an aim, a purpose line):
 * tidied, with the first letter capitalised so it reads as a sentence even
 * when the staff member typed it lowercase.
 */
export function asLead(s: string | null | undefined): string {
  const t = tidy(s);
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

/**
 * Lowercase a phrase for embedding mid-sentence (e.g. "a few minutes about
 * {theme}"), but keep the pronoun "I" upright. Lowercasing happens first, then
 * the pronoun is restored, so a clean "I" is never flattened.
 */
export function softLower(s: string | null | undefined): string {
  return fixPersonalI(String(s ?? "").replace(/\s+/g, " ").trim().toLowerCase());
}
