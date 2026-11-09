import { describe, it, expect } from "vitest";
import { runIntakePipeline, type PatternCandidate } from "../intake-pipeline";
import { PRACTICE_PATTERNS, validatePracticePattern, type PracticePattern } from "../practice-patterns";
import {
  containsDirectQuotation,
  decideCandidate,
  mergeWithSeededLibrary,
  orderReviewQueue,
  type ApprovalWording,
} from "../review-queue";

// Fictional practitioner and reviewer throughout.
function candidate(overrides: Partial<PatternCandidate> = {}): PatternCandidate {
  const r = runIntakePipeline(
    {
      url: "https://practice-notes.example.org/posts/evaluation",
      author: "Sam Fieldwell",
      note: "Regulation 99 and Reg 45 both matter here: stop listing activity, explain the difference it made for each child.",
      published: "2026-11-02",
      publicly_available: true,
    },
    { roster: [], voices: [], existing: [], submittedBy: "mgr-fixture-1", now: "2026-11-09T10:00:00.000Z", today: "2026-11-09" },
  );
  if (r.outcome !== "accepted") throw new Error("fixture should be accepted");
  return { id: "cand-1", ...r.candidate, ...overrides };
}

const REVIEWER = { userId: "mgr-fixture-2", name: "Alex Reviewer" };
const CLOCK = { now: "2026-11-09T12:00:00.000Z", today: "2026-11-09" };

const WORDING: ApprovalWording = {
  name: "Evaluate the difference, not the activity",
  summary: "A review earns its place by explaining what changed for each child and how the home knows, rather than listing what was done.",
  key_questions: ["What changed for the child, and what tells us so?"],
  evidence_indicators: ["The child's own account of what changed is recorded"],
};

describe("orderReviewQueue", () => {
  it("puts tier 1 first, untiered last, and the oldest first within a tier; decided items drop out", () => {
    const q = orderReviewQueue([
      candidate({ id: "untiered-old", tier: null, received_at: "2026-11-01T09:00:00.000Z" }),
      candidate({ id: "t2", tier: 2, received_at: "2026-11-03T09:00:00.000Z" }),
      candidate({ id: "t1-new", tier: 1, received_at: "2026-11-08T09:00:00.000Z" }),
      candidate({ id: "t1-old", tier: 1, received_at: "2026-11-02T09:00:00.000Z" }),
      candidate({ id: "done", tier: 1, status: "approved" }),
    ]);
    expect(q.map((c) => c.id)).toEqual(["t1-old", "t1-new", "t2", "untiered-old"]);
  });
});

describe("decideCandidate", () => {
  it("EVAL: refuses an approval without a named reviewer", () => {
    for (const name of [null, "", "   "]) {
      const r = decideCandidate(candidate(), { decision: "approve", reason: "Clear and specific.", pattern: WORDING }, { userId: "mgr-fixture-2", name }, CLOCK);
      expect(r).toMatchObject({ ok: false, status: 403 });
    }
  });

  it("requires a recorded reason, and refuses a candidate that was already decided", () => {
    expect(decideCandidate(candidate(), { decision: "reject", reason: "no" }, REVIEWER, CLOCK)).toMatchObject({ ok: false, status: 422 });
    expect(
      decideCandidate(candidate({ status: "rejected" }), { decision: "reject", reason: "Duplicate of an existing pattern." }, REVIEWER, CLOCK),
    ).toMatchObject({ ok: false, status: 409 });
  });

  it("builds a valid, attributed practitioner-view pattern from the reviewer's own wording", () => {
    const r = decideCandidate(candidate(), { decision: "approve", reason: "Specific and well evidenced.", pattern: WORDING }, REVIEWER, CLOCK);
    expect(r.ok).toBe(true);
    if (!r.ok || r.outcome !== "approved") return;
    expect(r.decision).toEqual({
      outcome: "approved",
      by: "mgr-fixture-2",
      by_name: "Alex Reviewer",
      at: CLOCK.now,
      reason: "Specific and well evidenced.",
    });
    expect(r.pattern).toMatchObject({
      claim_basis: "practitioner_view",
      provenance: "derived_external",
      status: "approved",
      retrieved_at: "2026-11-09",
      source: {
        author: "Sam Fieldwell",
        platform: "practice-notes.example.org",
        published: "2026-11-02",
        url: "https://practice-notes.example.org/posts/evaluation",
      },
    });
    // Only the verified citation survives: Regulation 99 is not in the catalogue.
    expect(r.pattern.regulation_refs).toEqual(["reg-45"]);
    expect(r.pattern.domains).toEqual(expect.arrayContaining(["reg-45", "evidence-vs-evaluation"]));
    expect(validatePracticePattern({ id: "x", ...r.pattern }).ok).toBe(true);
  });

  it("never lets an intake pattern claim a regulation or quality-standard basis", () => {
    for (const claim_basis of ["regulation", "quality_standard", "cara_doctrine"] as const) {
      const r = decideCandidate(candidate(), { decision: "approve", reason: "Looks statutory to me.", pattern: { ...WORDING, claim_basis } }, REVIEWER, CLOCK);
      expect(r).toMatchObject({ ok: false, status: 422 });
    }
  });

  it("P4-5: refuses approved wording that carries a direct quotation", () => {
    const r = decideCandidate(
      candidate(),
      { decision: "approve", reason: "Good insight.", pattern: { ...WORDING, summary: "As she put it, “every review should tell the child's story of change”, and we agree." } },
      REVIEWER,
      CLOCK,
    );
    expect(r).toMatchObject({ ok: false, status: 422 });
    expect(containsDirectQuotation(["The child's view isn't optional."])).toBe(false);
  });

  it("records a rejection with who, when and why", () => {
    const r = decideCandidate(candidate(), { decision: "reject", reason: "Too general to change practice." }, REVIEWER, CLOCK);
    expect(r).toEqual({
      ok: true,
      outcome: "rejected",
      decision: { outcome: "rejected", by: "mgr-fixture-2", by_name: "Alex Reviewer", at: CLOCK.now, reason: "Too general to change practice." },
    });
  });
});

describe("mergeWithSeededLibrary (P4-6)", () => {
  function runtime(overrides: Partial<PracticePattern> = {}): PracticePattern {
    const r = decideCandidate(candidate(), { decision: "approve", reason: "Specific and well evidenced.", pattern: WORDING }, REVIEWER, CLOCK);
    if (!r.ok || r.outcome !== "approved") throw new Error("fixture should approve");
    return { id: "rt-1", ...r.pattern, ...overrides };
  }

  it("adds a valid approved runtime pattern after the seeded library", () => {
    const m = mergeWithSeededLibrary([{ ...runtime(), created_at: "2026-11-09T12:00:00Z" }]);
    expect(m.skipped).toBe(0);
    expect(m.patterns).toHaveLength(PRACTICE_PATTERNS.length + 1);
    expect(m.patterns.at(-1)?.id).toBe("rt-1");
    expect(m.patterns.at(-1)).not.toHaveProperty("created_at");
  });

  it("skips and counts records that are malformed, unattributed, unapproved, regulation-based or collide with a seed", () => {
    const m = mergeWithSeededLibrary([
      { not: "a pattern" },
      runtime({ id: "rt-unattributed", source: { author: " ", platform: "Blog" } }),
      runtime({ id: "rt-pending", status: "pending_review" }),
      runtime({ id: "rt-reg", claim_basis: "regulation" }),
      runtime({ id: PRACTICE_PATTERNS[0].id }),
    ]);
    expect(m.skipped).toBe(5);
    expect(m.patterns).toHaveLength(PRACTICE_PATTERNS.length);
  });
});
