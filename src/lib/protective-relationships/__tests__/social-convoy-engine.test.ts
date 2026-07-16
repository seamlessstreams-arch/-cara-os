import { describe, it, expect } from "vitest";
import { computeSocialConvoy } from "../social-convoy-engine";
import type { RelationshipEntry } from "../types";

// The convoy engine's contract, from the Practice OS brief:
//   - Scenario G: no inner-circle adult raises a relational-PLANNING prompt,
//     never a safeguarding conclusion;
//   - every detection carries evidence entry ids and a whyShown;
//   - derived circles say they were derived, and why;
//   - silence (an unmapped network) reads as insufficient information, not risk.

const NOW = new Date("2026-07-16T12:00:00Z");

let n = 0;
function entry(over: Partial<RelationshipEntry>): RelationshipEntry {
  n += 1;
  return {
    id: `rel_${n}`,
    child_id: "yp_test",
    home_id: "home_test",
    name: over.name ?? `Person ${n}`,
    relationship_to_child: "key worker",
    category: "safe_adult",
    rating: "protective",
    child_view: "",
    staff_view: "",
    manager_view: "",
    known_concerns: "",
    known_strengths: "",
    contact_arrangements: "",
    restrictions: "",
    linked_record_ids: [],
    review_date: null,
    status: "active",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    created_by: "staff_test",
    updated_by: "staff_test",
    ...over,
  };
}

describe("circle assignment", () => {
  it("honours a recorded circle and labels it 'recorded'", () => {
    const c = computeSocialConvoy("yp_test", [
      entry({ circle: "inner", category: "family_support", name: "Nan" }),
      entry({ category: "positive_peer", rating: "neutral" }),
    ], NOW);
    const nan = c.inner.find((m) => m.name === "Nan");
    expect(nan?.basis).toBe("recorded");
    expect(nan?.derivedBecause).toBeUndefined();
  });

  it("derives inner for goto_when_upset and says why", () => {
    const c = computeSocialConvoy("yp_test", [
      entry({ category: "goto_when_upset", name: "Sam" }),
      entry({ category: "positive_peer", rating: "neutral" }),
    ], NOW);
    const sam = c.inner.find((m) => m.name === "Sam");
    expect(sam?.basis).toBe("derived");
    expect(sam?.derivedBecause).toMatch(/goes to this person/i);
  });

  it("keeps professionals outer unless a human recorded otherwise", () => {
    const c = computeSocialConvoy("yp_test", [
      entry({ category: "trusted_professional", name: "SW" }),
      entry({ category: "trusted_professional", name: "Therapist", circle: "inner" }),
    ], NOW);
    expect(c.outer.map((m) => m.name)).toContain("SW");
    expect(c.inner.map((m) => m.name)).toContain("Therapist");
  });

  it("never derives closeness for a risk-rated relationship", () => {
    const c = computeSocialConvoy("yp_test", [
      entry({ rating: "risk", category: "risk_peer", emotional_closeness: "high" }),
      entry({ category: "family_support" }),
    ], NOW);
    expect(c.inner).toHaveLength(0);
    const risky = c.outer.find((m) => m.rating === "risk");
    expect(risky?.derivedBecause).toMatch(/recorded human judgement/i);
  });
});

describe("Scenario G — no inner-circle adult", () => {
  it("raises a planning prompt with evidence, phrased as a prompt not a conclusion", () => {
    const c = computeSocialConvoy("yp_test", [
      entry({ category: "positive_peer", rating: "neutral" }),
      entry({ category: "trusted_professional" }),
      entry({ rating: "protective", category: "family_support", emotional_closeness: "low" }),
    ], NOW);
    const d = c.detections.find((x) => x.key === "no_inner_circle_adult");
    expect(d).toBeTruthy();
    expect(d!.tone).toBe("prompt");
    expect(d!.evidenceEntryIds.length).toBeGreaterThan(0);
    expect(d!.whyShown).toMatch(/not a conclusion/i);
    expect(d!.suggestedQuestions.length).toBeGreaterThan(0);
  });

  it("does not fire when an inner-circle adult exists", () => {
    const c = computeSocialConvoy("yp_test", [
      entry({ category: "goto_when_upset" }),
      entry({ category: "positive_peer", rating: "neutral" }),
    ], NOW);
    expect(c.detections.find((x) => x.key === "no_inner_circle_adult")).toBeUndefined();
  });
});

describe("network-shape detections", () => {
  it("flags overreliance when exactly one close adult exists and no middle fallback", () => {
    const c = computeSocialConvoy("yp_test", [
      entry({ category: "goto_when_upset", name: "Ryan" }),
      entry({ category: "positive_peer", rating: "neutral" }),
      entry({ category: "trusted_professional" }),
    ], NOW);
    const d = c.detections.find((x) => x.key === "overreliance_single_adult");
    expect(d?.headline).toContain("Ryan");
    expect(d?.evidenceEntryIds).toHaveLength(1);
  });

  it("flags a professionalised network only when professionals dominate AND inner has no unpaid person", () => {
    const professionalised = computeSocialConvoy("yp_test", [
      entry({ category: "trusted_professional" }),
      entry({ category: "trusted_professional" }),
      entry({ category: "trusted_professional" }),
      entry({ category: "positive_peer", rating: "neutral" }),
    ], NOW);
    expect(professionalised.detections.some((x) => x.key === "professionalised_network")).toBe(true);

    const balanced = computeSocialConvoy("yp_test", [
      entry({ category: "trusted_professional" }),
      entry({ category: "goto_when_upset" }),
      entry({ category: "family_support" }),
    ], NOW);
    expect(balanced.detections.some((x) => x.key === "professionalised_network")).toBe(false);
  });

  it("counts repeated loss from recently archived entries", () => {
    const c = computeSocialConvoy("yp_test", [
      entry({ category: "goto_when_upset" }),
      entry({ status: "archived", updated_at: "2026-06-01T00:00:00Z" }),
      entry({ status: "archived", updated_at: "2026-05-01T00:00:00Z" }),
    ], NOW);
    const d = c.detections.find((x) => x.key === "repeated_relationship_loss");
    expect(d?.evidenceEntryIds).toHaveLength(2);
  });

  it("surfaces stale inner-circle contact only when the field is recorded", () => {
    const c = computeSocialConvoy("yp_test", [
      entry({ category: "goto_when_upset", last_meaningful_contact: "2026-03-01T00:00:00Z", name: "Nan" }),
      entry({ category: "family_support", circle: "inner" }), // no field → no claim
      entry({ category: "positive_peer", rating: "neutral" }),
    ], NOW);
    const d = c.detections.find((x) => x.key === "stale_inner_contact");
    expect(d?.evidenceEntryIds).toHaveLength(1);
    expect(d?.whyShown).toContain("Nan");
  });

  it("names growth as a positive, not a prompt", () => {
    const c = computeSocialConvoy("yp_test", [
      entry({ category: "goto_when_upset", created_at: "2026-06-20T00:00:00Z" }),
      entry({ category: "positive_peer", rating: "neutral", created_at: "2026-07-01T00:00:00Z" }),
    ], NOW);
    const d = c.detections.find((x) => x.key === "network_growth");
    expect(d?.tone).toBe("positive");
  });
});

describe("silence is not evidence", () => {
  it("reports insufficient information instead of alarming prompts when almost nothing is mapped", () => {
    const c = computeSocialConvoy("yp_test", [entry({})], NOW);
    expect(c.insufficientInformation).toBe(true);
    expect(c.detections).toHaveLength(0);
  });

  it("every detection always carries evidence ids", () => {
    const c = computeSocialConvoy("yp_test", [
      entry({ category: "trusted_professional" }),
      entry({ category: "trusted_professional" }),
      entry({ category: "trusted_professional" }),
      entry({ status: "archived", updated_at: "2026-06-01T00:00:00Z" }),
      entry({ status: "archived", updated_at: "2026-06-10T00:00:00Z" }),
    ], NOW);
    expect(c.detections.length).toBeGreaterThan(0);
    for (const d of c.detections) expect(d.evidenceEntryIds.length).toBeGreaterThan(0);
  });

  it("only reads entries for the requested child", () => {
    const c = computeSocialConvoy("yp_test", [
      entry({ child_id: "yp_other", category: "goto_when_upset" }),
      entry({ category: "positive_peer", rating: "neutral" }),
      entry({ category: "family_support" }),
    ], NOW);
    const all = [...c.inner, ...c.middle, ...c.outer];
    expect(all).toHaveLength(2);
    expect(c.detections.some((x) => x.key === "no_inner_circle_adult")).toBe(true);
  });
});
