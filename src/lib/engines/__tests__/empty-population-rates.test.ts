import { describe, it, expect } from "vitest";
import { computeChildVoiceParticipation } from "../child-voice-participation-engine";
import { computeChildSafeguarding } from "../child-safeguarding-intelligence-engine";

// Seven child-domain engines each carried an identical local helper:
//
//   function pct(n: number, d: number): number {
//     return d > 0 ? Math.round((n / d) * 100) : 100;
//   }
//
// An empty population reported as 100% compliant. It was allowlisted in
// check-fabricated-scores.js with the note that "call-site correctness depends
// on each caller's semantics" — the question was deferred to the call sites and
// never answered. Auditing all 45 of them found none where the deferral held:
// every denominator is "the things that happened", not "the adverse events
// still to resolve", so 0 means nothing measured.
//
// On the seeded tenant every child has records, so the change is behaviour-
// neutral there. It is the child with nothing recorded yet — newly placed, or
// newly opened home — who used to read 100% across the board. That is the case
// these assert.

const TODAY = "2026-08-23";

describe("a child with nothing recorded does not read as 100% compliant", () => {
  it("child voice: no reviews, key work or feedback is unmeasured, not perfect", () => {
    const r = computeChildVoiceParticipation({
      today: TODAY,
      children: [{ id: "yp_new", name: "Newly Placed" }],
      lac_reviews: [],
      advocacy_records: [],
      key_work_sessions: [],
      feedback_entries: [],
    });

    // Each of these read 100 before: a child whose voice has never been sought
    // scored a perfect participation record.
    expect(r.review_participation.participation_rate).toBeNull();
    expect(r.review_participation.views_recorded_rate).toBeNull();
    expect(r.key_work_engagement.engagement_rate).toBeNull();
    expect(r.key_work_engagement.views_capture_rate).toBeNull();
    expect(r.feedback_analysis.response_rate).toBeNull();
    expect(r.feedback_analysis.response_within_target_rate).toBeNull();
  });

  it("safeguarding: no episodes or restraints is unmeasured, not fully compliant", () => {
    const r = computeChildSafeguarding({
      today: TODAY,
      child_id: "yp_new",
      child_name: "Newly Placed",
      child_age: 14,
      risk_assessments: [],
      incidents: [],
      missing_episodes: [],
      restraints: [],
      contextual_markers: [],
    });

    // "100% of return interviews completed" and "100% of restraints debriefed"
    // for a child who has had neither is the reassurance this class exists to
    // prevent — and on a safeguarding surface it is the worst place for it.
    expect(r.missing_profile.return_interview_rate).toBeNull();
    expect(r.restraint_profile.debrief_rate).toBeNull();
    expect(r.restraint_profile.review_rate).toBeNull();
  });

  it("does not swing to the other lie either", () => {
    // `?? 0` readers would report the same absence as total failure. null must
    // survive to the output rather than collapsing to 0.
    const r = computeChildVoiceParticipation({
      today: TODAY,
      children: [{ id: "yp_new", name: "Newly Placed" }],
      lac_reviews: [],
      advocacy_records: [],
      key_work_sessions: [],
      feedback_entries: [],
    });
    expect(r.review_participation.participation_rate).not.toBe(0);
    expect(r.key_work_engagement.engagement_rate).not.toBe(0);
  });
});
