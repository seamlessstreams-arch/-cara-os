import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";
import { getStore } from "@/lib/db/store";

// Three mappings here named fields the records do not have, and each one
// resolved to a constant:
//
//   child_participated  always false  — LACReview says child_participation
//   family_attended     always false  — the record carries an attendee list
//   contact_discussed   always TRUE   — the record carries key_discussions
//   family_related      always false  — MissingEpisode has no `trigger`, so
//                                       the .includes() ran on ""
//
// Measured on yp_alex: child_participated_lac_pct 0% → 100% (the children had
// participated in every review on file), family_related_missing 0 → 1.

const CHILD = "yp_alex";
const call = () => GET(new NextRequest(`http://localhost/api/v1/family-relationships-intelligence?childId=${CHILD}`));

describe("GET /api/v1/family-relationships-intelligence — LAC participation", () => {
  it("credits participation the review actually records", async () => {
    const reviews = getStore().lacReviews.filter((r) => r.child_id === CHILD);
    const participated = reviews.filter((r) => r.child_participation !== "did_not_participate");

    // Non-vacuity: 0 of 0 would agree with the old constant false.
    expect(reviews.length).toBeGreaterThan(0);
    expect(participated.length).toBeGreaterThan(0);

    const body = (await (await call()).json()).data;
    // Engine reports over the last 12 months, so this is a floor, not equality.
    expect(body.professional_engagement.child_participated_lac_pct).toBeGreaterThan(0);
  });

  it("does not claim contact was discussed at a review with no recorded discussions", async () => {
    // `contact_discussed` used to be hard-coded true for every review. Two of
    // this child's reviews have an empty key_discussions list, so an honest
    // reading cannot be true for all of them.
    const reviews = getStore().lacReviews.filter((r) => r.child_id === CHILD);
    expect(reviews.some((r) => r.key_discussions.length === 0)).toBe(true);
    expect(reviews.some((r) => r.key_discussions.join(" ").toLowerCase().includes("contact"))).toBe(true);
  });
});

describe("GET /api/v1/family-relationships-intelligence — missing episodes", () => {
  it("can recognise a family-related episode at all", async () => {
    // `family_related` read `m.trigger ?? m.possible_reason ?? ""` — neither is
    // on MissingEpisode, so it tested "" and was permanently false. A child who
    // goes missing around family contact is exactly what this engine exists to
    // surface.
    const episodes = getStore().missingEpisodes.filter((m) => m.child_id === CHILD);
    const withNotes = episodes.filter(
      (m) => (m.return_interview_notes ?? "") !== "" || (m.pattern_notes ?? "") !== "",
    );
    expect(withNotes.length).toBeGreaterThan(0); // non-vacuity: there IS text to read

    const body = (await (await call()).json()).data;
    expect(body.placement_impact.family_related_missing).toBeGreaterThan(0); // was 0 for every child
  });
});
