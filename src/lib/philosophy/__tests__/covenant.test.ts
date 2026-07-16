import { describe, it, expect } from "vitest";
import { reviewTone, honoursTone, readsAsInvitation } from "../covenant";

// The heart is a testable property. This suite is the covenant's teeth: Cara's
// own generated copy must speak about children with warmth, to staff with
// respect, and about incidents without blame.

describe("deficit labels about children", () => {
  it("catches labels reused from the care-language vocabulary, with the alternative", () => {
    const v = reviewTone("The young person was being manipulative and naughty.", "about_child");
    const phrases = v.map((x) => x.phrase);
    expect(phrases).toContain("manipulative");
    expect(phrases).toContain("naughty");
    expect(v.find((x) => x.phrase === "manipulative")?.preferred).toMatch(/unmet need/i);
    expect(v.every((x) => x.kind === "deficit_label")).toBe(true);
  });

  it("catches deficit labels in EVERY audience — they are never acceptable in Cara's voice", () => {
    for (const a of ["about_child", "to_staff", "about_incident", "alert"] as const) {
      expect(reviewTone("kicked off again", a).some((x) => x.phrase === "kicked off")).toBe(true);
    }
  });

  it("does not false-positive on innocent substrings", () => {
    // "bad behaviour" is a pattern; "badminton" must not trip the single-token guard.
    expect(honoursTone("They enjoyed a game of badminton.", "about_child")).toBe(true);
  });
});

describe("accusatory / blame framing in Cara's own alerts", () => {
  it("catches accusatory alert language and offers an invitation instead", () => {
    const v = reviewTone("Non-compliance detected: violation of the recording policy.", "alert");
    expect(v.some((x) => x.phrase === "non-compliance")).toBe(true);
    expect(v.some((x) => x.phrase === "violation")).toBe(true);
    expect(v.find((x) => x.phrase === "non-compliance")?.preferred).toMatch(/closer look/i);
  });

  it("catches blaming framing addressed to staff", () => {
    const v = reviewTone("You failed to complete the handover. You should have logged it.", "to_staff");
    expect(v.some((x) => x.phrase === "failed to" && x.kind === "blaming")).toBe(true);
    expect(v.some((x) => x.phrase === "you should have")).toBe(true);
  });

  it("does NOT enforce accusatory terms inside a verbatim incident account", () => {
    // A record quoting what happened may unavoidably contain such words; the
    // covenant governs Cara's OWN framing, not quoted fact.
    const v = reviewTone("Staff recorded a failure to de-escalate before the incident.", "about_incident");
    expect(v.some((x) => x.kind === "blaming" || x.kind === "accusatory")).toBe(false);
  });
});

describe("the affirmative half — invitation, not accusation", () => {
  it("recognises curiosity markers", () => {
    expect(readsAsInvitation("This pattern is worth a closer look.")).toBe(true);
    expect(readsAsInvitation("Consider whether the evening routine is a factor.")).toBe(true);
    expect(readsAsInvitation("Recording policy breached.")).toBe(false);
  });
});

describe("Cara already speaks this way — its shipped alert copy honours the covenant", () => {
  // Real "Why Cara is showing this" lines from engines shipped this session
  // (social convoy, voice follow-through, regulation profile). They must pass
  // the covenant they will eventually be checked by.
  const shipped = [
    "This prompts relational planning — it is not a conclusion about the child.",
    "Repetition is the child telling us the first response did not land — this prompts a manager conversation, it does not allege fault.",
    "From the child's side, silence is indistinguishable from being ignored.",
    "These are drafts from behaviour records — accept, edit or ignore them.",
    "No divergence recorded yet. That is not evidence the flip is safe.",
    "Worth naming to the child and protecting in planning.",
  ];
  for (const line of shipped) {
    it(`honours the covenant: "${line.slice(0, 48)}…"`, () => {
      expect(reviewTone(line, "alert")).toEqual([]);
    });
  }
});
