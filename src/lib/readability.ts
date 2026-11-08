// ══════════════════════════════════════════════════════════════════════════════
// READABILITY — deterministic reading-level scoring (Flesch–Kincaid + SMOG)
//
// Pure, keyless, explainable. Used to ASSERT that child-facing adapted content
// actually hits the target reading band, and to flag it VISIBLY to the reviewer
// when it does not (never ship a too-hard version silently). Shared so it is not
// re-implemented per feature.
// ══════════════════════════════════════════════════════════════════════════════

export interface ReadabilityScore {
  words: number;
  sentences: number;
  syllables: number;
  polysyllables: number; // words with >= 3 syllables
  /** Flesch–Kincaid Grade Level (US school grade). */
  fleschKincaidGrade: number;
  /** SMOG grade. */
  smogGrade: number;
  /** Representative grade used for banding (the harder of FK / SMOG, rounded). */
  grade: number;
  /** Approximate reading age in years (grade + 5). */
  readingAge: number;
  /** Human band label, e.g. "age 7–9". */
  band: string;
}

export interface ReadabilityCheck {
  score: ReadabilityScore;
  target: ReadingTarget;
  withinTarget: boolean;
  /** Visible reviewer warning when the content is harder than the target; null when fine. */
  flag: string | null;
}

export interface ReadingTarget {
  maxReadingAge: number;
  label: string;
  reason: string;
}

// Count syllables in a single word — the standard FK vowel-group heuristic.
// Deterministic and approximate (no dictionary); good enough for banding.
export function countSyllables(raw: string): number {
  const word = raw.toLowerCase().replace(/[^a-z]/g, "");
  if (!word) return 0;
  if (word.length <= 3) return 1;
  const trimmed = word
    .replace(/(?:[^laeiouy]es|[^laeiouy]ed|[^laeiouy]e)$/, "")
    .replace(/^y/, "");
  const groups = trimmed.match(/[aeiouy]{1,2}/g);
  return groups ? groups.length : 1;
}

function splitWords(text: string): string[] {
  return text.split(/\s+/).filter((w) => /[a-z]/i.test(w));
}

function countSentences(text: string): number {
  // A run of terminal punctuation counts once; always at least one sentence.
  const matches = text.match(/[.!?]+/g);
  return Math.max(1, matches ? matches.length : 0);
}

/** Score the readability of a block of text. Empty/near-empty text scores as trivially simple. */
export function assessReadability(text: string): ReadabilityScore {
  const words = splitWords(text);
  const wordCount = words.length;
  const sentences = countSentences(text);

  if (wordCount === 0) {
    return {
      words: 0, sentences, syllables: 0, polysyllables: 0,
      fleschKincaidGrade: 0, smogGrade: 0, grade: 0, readingAge: 5, band: bandForReadingAge(5),
    };
  }

  let syllables = 0;
  let polysyllables = 0;
  for (const w of words) {
    const s = countSyllables(w);
    syllables += s;
    if (s >= 3) polysyllables += 1;
  }

  const wordsPerSentence = wordCount / sentences;
  const syllablesPerWord = syllables / wordCount;

  const fleschKincaidGrade =
    0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;
  const smogGrade =
    1.043 * Math.sqrt(polysyllables * (30 / sentences)) + 3.1291;

  // Band on the harder of the two, floored at 0 (never report a negative grade).
  const grade = Math.max(0, Math.round(Math.max(fleschKincaidGrade, smogGrade)));
  const readingAge = grade + 5;

  return {
    words: wordCount,
    sentences,
    syllables,
    polysyllables,
    fleschKincaidGrade: round1(fleschKincaidGrade),
    smogGrade: round1(smogGrade),
    grade,
    readingAge,
    band: bandForReadingAge(readingAge),
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function bandForReadingAge(age: number): string {
  if (age <= 7) return "age 5–7";
  if (age <= 9) return "age 7–9";
  if (age <= 11) return "age 9–11";
  if (age <= 14) return "age 11–14";
  return "age 14+";
}

// Literacy-affecting needs pull the target down to an easier band. Names match
// the adaptation engine's AdaptationNeed ids.
const LITERACY_NEEDS = new Set([
  "low_literacy", "dyslexia", "eal", "speech_and_language",
]);

/**
 * Derive the target reading band for child-facing content.
 * - an explicit reading age on the profile wins;
 * - otherwise literacy-affecting needs → age ≤ 9, else a default child band of age ≤ 11.
 */
export function readingTargetForNeeds(needs: string[], profileReadingAge?: number | null): ReadingTarget {
  if (typeof profileReadingAge === "number" && Number.isFinite(profileReadingAge) && profileReadingAge > 0) {
    return { maxReadingAge: profileReadingAge, label: bandForReadingAge(profileReadingAge), reason: "child's recorded reading age" };
  }
  const hasLiteracyNeed = needs.some((n) => LITERACY_NEEDS.has(n));
  return hasLiteracyNeed
    ? { maxReadingAge: 9, label: "age 7–9", reason: "literacy-affecting need declared" }
    : { maxReadingAge: 11, label: "age 9–11", reason: "default child-facing band" };
}

/** Score the text and assert it against the target; produce a visible flag when it misses. */
export function checkReadability(text: string, target: ReadingTarget): ReadabilityCheck {
  const score = assessReadability(text);
  const withinTarget = score.readingAge <= target.maxReadingAge;
  return {
    score,
    target,
    withinTarget,
    flag: withinTarget
      ? null
      : `Reading level is about ${score.band} (≈ age ${score.readingAge}), above the target of ${target.label} — simplify before giving this to the child.`,
  };
}
