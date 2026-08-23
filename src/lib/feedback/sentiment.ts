// ══════════════════════════════════════════════════════════════════════════════
// CARA — WHAT A CHILD'S FEEDBACK ACTUALLY SAYS
//
// Children record feedback on a five-point mood scale: very_happy, happy, ok,
// unhappy, very_unhappy. That is `YPFeedbackSentiment`, and it has never
// carried the values "positive" or "negative".
//
// Two intelligence routes classified feedback with
//
//     f.sentiment === "positive" ? "compliment"
//       : f.sentiment === "negative" ? "complaint"
//       : "suggestion"
//
// Neither comparison can ever be true, so EVERY entry from EVERY child came
// out as a bare "suggestion" — no compliment was ever recognised as praise and
// no complaint was ever recognised as a complaint. Both sites now call this,
// so the mapping is stated once and can be tested.
// ══════════════════════════════════════════════════════════════════════════════

import type { YPFeedbackSentiment } from "@/types/extended";

export type YPFeedbackType = "compliment" | "complaint" | "suggestion";

/**
 * Classify a feedback entry from the mood the child recorded.
 *
 * "ok" is deliberately a suggestion rather than a compliment: a neutral answer
 * is not praise, and reading it as praise is the same flattery the fabricated-
 * score rules exist to prevent. An unrecorded sentiment is a suggestion too —
 * which is what every entry used to be, so nothing regresses.
 */
export function feedbackTypeFromSentiment(
  sentiment: YPFeedbackSentiment | null | undefined,
): YPFeedbackType {
  switch (sentiment) {
    case "very_happy":
    case "happy":
      return "compliment";
    case "unhappy":
    case "very_unhappy":
      return "complaint";
    default:
      return "suggestion";
  }
}
