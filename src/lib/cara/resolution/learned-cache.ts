// ══════════════════════════════════════════════════════════════════════════════
// Cara LEARNED-ANSWER CACHE — tier 2 of the intelligence chain
//
// The chain: (1) deterministic RULES (rules-engine.ts, ~60% of commands, £0) →
// (2) this LEARNED CACHE (replay a near-identical past answer, £0) → (3) Claude,
// the last resort. When Claude IS called we learn its answer here, so the next
// near-identical request skips the API. Net effect: Claude calls fall over time.
//
// SAFETY (regulated children's care). This cache is deliberately conservative:
//   • Only LOW-risk commands are ever cached — never safeguarding / risk / medical /
//     placement work, which must always be produced fresh and human-reviewed.
//   • Answers are bucketed by child, so a learned answer is never matched across
//     different children.
//   • Only NEAR-IDENTICAL input (high Jaccard overlap) replays a cached answer —
//     no semantic generalisation that could surface a subtly-wrong answer.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import { tokenize, jaccard } from "@/lib/duplicate-detection/duplicate-detection-engine";

/** Replay a learned answer only when the input is essentially the same request. */
const LOOKUP_THRESHOLD = 0.9;
/** Don't store a second entry that's already near-identical to one we learned. */
const DEDUPE_THRESHOLD = 0.95;
/** Too-short inputs aren't distinctive enough to cache/replay safely. */
const MIN_INPUT_LEN = 20;

// Defence-in-depth on top of the low-risk gate: never learn/replay anything whose
// command id touches safeguarding, risk, medical, placement or missing-from-care work.
const SENSITIVE =
  /safeguard|risk|incident|medication|missing|allegation|restrain|placement|protection|disclosure|self.?harm|suicide|sexual|abuse|neglect/i;

/** Whether a command's answers may be cached at all. Conservative by design. */
export function isCacheableCommand(commandId: string, riskLevel?: string): boolean {
  if (riskLevel && riskLevel !== "low") return false; // only low-risk synthesis
  if (SENSITIVE.test(commandId)) return false;
  return true;
}

// In-memory counters (per server instance) for visibility into how much the cache saves.
let lookups = 0;
let hits = 0;

export interface LearnedLookup {
  output: string;
  confidence: string;
}

/**
 * Return a learned answer for a near-identical past request, or null to fall through
 * to Claude. Records a hit (and avoids an API call) when it matches.
 */
export function lookupLearnedAnswer(args: {
  commandId: string;
  childId: string | null;
  input: string;
  riskLevel?: string;
}): LearnedLookup | null {
  const input = (args.input ?? "").trim();
  if (input.length < MIN_INPUT_LEN) return null;
  if (!isCacheableCommand(args.commandId, args.riskLevel)) return null;

  lookups++;
  const needle = tokenize(input);
  if (needle.size === 0) return null;

  const bucket = db.caraResponseCache.findByBucket(args.commandId, args.childId ?? null);
  let best: { id: string; output: string; confidence: string; score: number } | null = null;
  for (const rec of bucket) {
    const score = jaccard(needle, tokenize(rec.input_text));
    if (score >= LOOKUP_THRESHOLD && (!best || score > best.score)) {
      best = { id: rec.id, output: rec.output, confidence: rec.confidence, score };
    }
  }
  if (!best) return null;

  db.caraResponseCache.recordHit(best.id);
  hits++;
  return { output: best.output, confidence: best.confidence };
}

/** Learn a fresh Claude answer so the next near-identical request can skip the API. */
export function learnAnswer(args: {
  commandId: string;
  childId: string | null;
  input: string;
  output: string;
  confidence: string;
  riskLevel?: string;
}): void {
  const input = (args.input ?? "").trim();
  const output = (args.output ?? "").trim();
  if (input.length < MIN_INPUT_LEN || output.length < 1) return;
  if (!isCacheableCommand(args.commandId, args.riskLevel)) return;

  const needle = tokenize(input);
  if (needle.size === 0) return;

  // Skip if we already learned a near-identical request for this bucket.
  const bucket = db.caraResponseCache.findByBucket(args.commandId, args.childId ?? null);
  for (const rec of bucket) {
    if (jaccard(needle, tokenize(rec.input_text)) >= DEDUPE_THRESHOLD) return;
  }

  db.caraResponseCache.create({
    command_id: args.commandId,
    child_id: args.childId ?? null,
    input_text: input,
    output,
    confidence: args.confidence,
  });
}

/** Visibility into how much the learned cache is reducing Claude usage. */
export function getLearnedCacheStats(): {
  entries: number;
  lookups: number;
  hits: number;
  hit_rate: number;
  claude_calls_saved: number;
} {
  const entries = db.caraResponseCache.findAll();
  const replays = entries.reduce((n, r) => n + r.hit_count, 0);
  return {
    entries: entries.length,
    lookups,
    hits,
    hit_rate: lookups > 0 ? Math.round((hits / lookups) * 100) / 100 : 0,
    claude_calls_saved: replays, // each replay is one Claude call that didn't happen
  };
}
