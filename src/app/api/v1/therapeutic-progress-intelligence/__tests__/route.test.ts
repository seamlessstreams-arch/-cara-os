import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";
import { getStore } from "@/lib/db/store";

// The outcomes section is the point of a therapeutic-progress engine, and it
// could not compute anything. `target`, `baseline_score` and `current_score`
// named fields OutcomeTarget does not have — it calls them target_description,
// baseline_rating and current_rating — so every target reached the engine with
// no text and both scores null, and the progress calculation filters on
// `baseline_score !== null`. It ran over an empty list for every child, and
// average_progress_pct was null.
//
// The engine then measured headroom against `10 - baseline` while the ratings
// it receives are OutcomeRating, 1-5. That halves every target: baseline 2 to
// current 4 is 2 of the 3 available points, 67%, not 25%.
//
// This computes the expected figure from the store with the engine's own
// filter and rounding, so it pins the field mapping and the scale together.

const CHILD = "yp_alex";
const call = () => GET(new NextRequest(`http://localhost/api/v1/therapeutic-progress-intelligence?childId=${CHILD}`));

describe("GET /api/v1/therapeutic-progress-intelligence — outcome progress", () => {
  it("computes progress from the ratings the targets actually carry", async () => {
    // The engine also filters `baseline_score !== 0`, which cannot exclude
    // anything here — OutcomeRating is 1-5, and tsc says so. Not reproduced.
    const scored = getStore().outcomeTargets.filter((t) => t.child_id === CHILD);

    // Non-vacuity: with no scored targets, "not null" would prove nothing, and
    // with baseline === current every scale would agree at 0%.
    expect(scored.length).toBeGreaterThan(0);
    expect(scored.some((t) => t.current_rating !== t.baseline_rating)).toBe(true);

    const RATING_MAX = 5;
    const pcts = scored.map((t) =>
      Math.round(((t.current_rating - t.baseline_rating) / Math.max(1, RATING_MAX - t.baseline_rating)) * 100),
    );
    const expected = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);

    const body = (await (await call()).json()).data;
    expect(body.outcome_progress.average_progress_pct).not.toBeNull(); // was null for every child
    expect(body.outcome_progress.average_progress_pct).toBe(expected);
  });

  it("counts every target, not only the ones it can score", async () => {
    const targets = getStore().outcomeTargets.filter((t) => t.child_id === CHILD);
    expect(targets.length).toBeGreaterThan(0);
    const body = (await (await call()).json()).data;
    expect(body.outcome_progress.total_targets).toBe(targets.length);
  });
});

describe("GET /api/v1/therapeutic-progress-intelligence — de-escalation", () => {
  it("reports an ungraded de-escalation as unmeasured rather than failed", async () => {
    // BehaviourEntry records what was tried (`strategy_used`) but never grades
    // whether it worked. `de_escalation_used` used to be hard-coded false, so
    // the rate was null because nothing counted as de-escalation at all. It is
    // still null, now because the outcomes are ungraded — which is the honest
    // reason. Counting them as failures would report 0% success.
    const entries = getStore().behaviourLog.filter(
      (b) => b.child_id === CHILD && b.strategy_used.trim().length > 0,
    );
    expect(entries.length).toBeGreaterThan(0); // de-escalation IS recorded

    const body = (await (await call()).json()).data;
    expect(body.behaviour_trajectory.de_escalation_success_rate).toBeNull();
  });
});
