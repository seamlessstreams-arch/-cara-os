// ══════════════════════════════════════════════════════════════════════════════
// CARA — HONEST RATES
//
// One rule, in one place: a percentage computed from an empty population is
// UNKNOWN, not 100%.
//
// Cara had ~200 sites shaped like this:
//
//     const trainingRate = mandatory.length > 0
//       ? Math.round((completed / mandatory.length) * 100)
//       : 100;                                   // ← no records = "fully compliant"
//
// On a newly-provisioned home that reads "100% training compliance, 100% DBS,
// 100% supervision" when in truth NOTHING has been evidenced. On an Ofsted
// readiness surface that inverts the meaning of the number: Ofsted judges on
// evidence, so an empty register is the finding, not a pass.
//
// `rate()` returns null for an empty denominator and every aggregate here
// ignores nulls, so an unmeasured domain can neither flatter nor penalise a
// home — it is reported separately, as a gap.
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Percentage of `numerator` out of `denominator`, or null when there is
 * nothing to measure.
 *
 * Null means "we cannot say", which is the honest answer for an empty
 * population. Callers must render it as "not yet measured" rather than
 * coercing it (`?? 100` re-introduces exactly the bug this exists to kill;
 * `?? 0` is the same lie in the other direction — it reports failure where
 * there is only silence).
 */
export function rate(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(denominator) || denominator <= 0) return null;
  if (!Number.isFinite(numerator)) return null;
  return Math.round((numerator / denominator) * 100);
}

/** `rate()` over two collections — the common `matching.length / all.length` shape. */
export function rateOf(matching: readonly unknown[], all: readonly unknown[]): number | null {
  return rate(matching.length, all.length);
}

/**
 * Mean of the values that are actually measured. Null when none are.
 *
 * Averaging with nulls treated as 0 or 100 is how a single unmeasured domain
 * swings a headline score, so they are dropped from both the sum and the count.
 */
export function meanOf(values: readonly (number | null | undefined)[]): number | null {
  const measured = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (measured.length === 0) return null;
  return Math.round(measured.reduce((s, v) => s + v, 0) / measured.length);
}

/**
 * Weighted mean over measured entries only, with the weights renormalised so
 * the result stays on the same 0-100 scale no matter how many entries are
 * unmeasured. Null when nothing is measured.
 */
export function weightedMeanOf(
  entries: readonly { score: number | null | undefined; weight: number }[],
): number | null {
  const measured = entries.filter(
    (e): e is { score: number; weight: number } =>
      typeof e.score === "number" && Number.isFinite(e.score) && e.weight > 0,
  );
  const weightSum = measured.reduce((s, e) => s + e.weight, 0);
  if (weightSum <= 0) return null;
  return Math.round(measured.reduce((s, e) => s + e.score * e.weight, 0) / weightSum);
}

/** True when a score exists and is at or above `threshold`. Unmeasured is never a pass. */
export function meets(score: number | null | undefined, threshold: number): boolean {
  return typeof score === "number" && Number.isFinite(score) && score >= threshold;
}

/** True when a score exists and is below `threshold`. Unmeasured is never a failure either. */
export function below(score: number | null | undefined, threshold: number): boolean {
  return typeof score === "number" && Number.isFinite(score) && score < threshold;
}

/** Render a rate for display: "87%" or an em dash when unmeasured. */
export function formatRate(score: number | null | undefined, unmeasured = "—"): string {
  return typeof score === "number" && Number.isFinite(score) ? `${score}%` : unmeasured;
}
