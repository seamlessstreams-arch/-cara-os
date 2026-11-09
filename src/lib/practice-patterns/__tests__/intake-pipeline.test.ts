import { describe, it, expect } from "vitest";
import {
  canonicaliseUrl,
  extractRegulationNumbers,
  isCandidateRecord,
  nearestSeedPattern,
  runIntakePipeline,
  screenForChildData,
  type IntakeContext,
  type IntakeSubmission,
  type PatternCandidate,
} from "../intake-pipeline";
import type { TrustedVoice } from "../trusted-voices";

// Every person and child below is fictional.
const ROSTER = [{ first_name: "Jordan", last_name: "Example", preferred_name: "Jojo" }];

const POST_URL =
  "https://www.linkedin.com/posts/sam-fieldwell-0001_reg45-activity-7123456789012345678-abcd?utm_source=share&utm_medium=member_desktop";

function submission(overrides: Partial<IntakeSubmission> = {}): IntakeSubmission {
  return {
    url: POST_URL,
    author: "Sam Fieldwell",
    note: "Our Reg 45 review stopped listing activity and started explaining the difference it made: what changed and the impact.",
    publicly_available: true,
    ...overrides,
  };
}

function ctx(overrides: Partial<IntakeContext> = {}): IntakeContext {
  return {
    roster: ROSTER,
    voices: [],
    existing: [],
    submittedBy: "mgr-fixture-1",
    now: "2026-11-09T10:00:00.000Z",
    today: "2026-11-09",
    ...overrides,
  };
}

function accepted(sub = submission(), c = ctx()) {
  const r = runIntakePipeline(sub, c);
  if (r.outcome !== "accepted") throw new Error(`expected accepted, got ${JSON.stringify(r)}`);
  return r.candidate;
}

function rejectedCodes(sub: IntakeSubmission, c = ctx()): string[] {
  const r = runIntakePipeline(sub, c);
  if (r.outcome !== "rejected") throw new Error(`expected rejected, got ${r.outcome}`);
  return r.reasons.map((x) => x.code);
}

function existingCandidate(overrides: Partial<PatternCandidate> = {}): PatternCandidate {
  return { id: "cand-1", ...accepted(), ...overrides };
}

describe("runIntakePipeline — accepted items", () => {
  it("queues a clean submission as a pending practitioner view, with tracking stripped", () => {
    const c = accepted();
    expect(c.status).toBe("pending_review");
    expect(c.claim_basis).toBe("practitioner_view");
    expect(c.platform).toBe("LinkedIn");
    expect(c.url).not.toMatch(/utm_/);
    expect(c.dedupe_key).toBe("linkedin:activity:7123456789012345678");
    expect(c.domains).toEqual(expect.arrayContaining(["reg-45", "evidence-vs-evaluation"]));
    expect(c.regulation_refs).toEqual([{ ref: "Regulation 45", verified: true }]);
    expect(c.flags).toEqual([]);
    expect(c.tier).toBeNull();
    expect(c.submissions).toEqual([
      { by: "mgr-fixture-1", at: "2026-11-09T10:00:00.000Z", note: submission().note },
    ]);
    expect(typeof c.sensitivity).toBe("string");
    expect(isCandidateRecord({ id: "x", ...c })).toBe(true);
  });

  it("points the reviewer at the nearest seed pattern, with the shared words as evidence", () => {
    const seed = accepted().nearest_seed;
    expect(seed?.id).toBe("pp_evidence_to_evaluation");
    expect(seed?.shared_terms.length).toBeGreaterThanOrEqual(3);
    expect(nearestSeedPattern("Weather forecast for the weekend.")).toBeNull();
  });
});

describe("runIntakePipeline — EVAL: an item naming a child is rejected", () => {
  it("rejects a child from the home named in full, by first name, or by preferred name", () => {
    for (const note of [
      "A lovely piece about how jordan example settled after a hard first month in placement.",
      "Jordan told the staff team what helped after the review meeting this week.",
      "Jojo told the staff team what helped after the review meeting this week.",
    ]) {
      expect(rejectedCodes(submission({ note }))).toContain("child_identifiable");
    }
  });

  it("never echoes the child's name back in the reason", () => {
    const r = runIntakePipeline(
      submission({ note: "Jordan told the staff team what helped after the review meeting this week." }),
      ctx(),
    );
    expect(JSON.stringify(r)).not.toMatch(/jordan/i);
  });

  it("rejects a child named with an age even when they are not on the roster", () => {
    for (const note of [
      "We supported a girl called Kayla who is 15 years old to rebuild contact with her nan.",
      "Kayla (14) found the move hard, and the staff team adjusted the routine around her.",
    ]) {
      expect(rejectedCodes(submission({ note }))).toContain("child_identifiable");
    }
  });

  it("rejects explicit identifiers: NHS number, postcode, date of birth, child record number", () => {
    const notes = [
      "The referral listed NHS number 943 476 5919 in the opening lines of the form.",
      "The placement was at an address in Leeds, LS1 4AP, which we should not have shared.",
      "Her date of birth 03/04/2011 was on the front sheet of the referral we received.",
      "The file was stored under LAC number 448812 on the old system for many years.",
    ];
    for (const note of notes) expect(rejectedCodes(submission({ note }))).toContain("child_identifiable");
  });

  it("rejects a link whose slug names a child from the home", () => {
    expect(rejectedCodes(submission({ url: "https://example.org/blog/jordan-example-our-story" }))).toContain(
      "child_identifiable",
    );
  });

  it("lets practice vocabulary through: S47, CP plan and LAC review are not identifiers", () => {
    const c = accepted(
      submission({
        note: "When an S47 enquiry starts, the CP plan and the next LAC review should be joined up for the child.",
      }),
    );
    expect(c.status).toBe("pending_review");
  });

  it("does not treat the verb 'will' as a child called Will, nor a regulation number as an age", () => {
    const roster = [{ first_name: "Will", last_name: "Sample", preferred_name: null }];
    expect(screenForChildData("Managers will review the plan monthly.", roster).blocked).toBe(false);
    expect(screenForChildData("Will said the plan helped.", roster).blocked).toBe(true);
    expect(screenForChildData("See Regulation (44) for the visit duty.", []).blocked).toBe(false);
  });
});

describe("runIntakePipeline — EVAL: a duplicate link is merged", () => {
  it("merges another manager's submission of the same post under a different LinkedIn URL", () => {
    const existing = existingCandidate();
    const r = runIntakePipeline(
      submission({
        url: "https://www.linkedin.com/feed/update/urn:li:activity:7123456789012345678/",
        note: "Worth a look for our next Reg 45: it shows what impact writing looks like in practice.",
      }),
      ctx({ existing: [existing], submittedBy: "mgr-fixture-2" }),
    );
    expect(r.outcome).toBe("merged");
    if (r.outcome === "merged") {
      expect(r.added).toBe(true);
      expect(r.candidate.id).toBe("cand-1");
      expect(r.candidate.submissions.map((s) => s.by)).toEqual(["mgr-fixture-1", "mgr-fixture-2"]);
    }
  });

  it("is idempotent when the same person resubmits the same note", () => {
    const r = runIntakePipeline(submission(), ctx({ existing: [existingCandidate()] }));
    expect(r.outcome).toBe("merged");
    if (r.outcome === "merged") {
      expect(r.added).toBe(false);
      expect(r.candidate.submissions).toHaveLength(1);
    }
  });

  it("reports a post that was already decided instead of queueing it again", () => {
    const decided = existingCandidate({
      status: "rejected",
      decision: { outcome: "rejected", by: "mgr-fixture-1", by_name: "A Manager", at: "2026-11-09", reason: "Too general." },
    });
    const r = runIntakePipeline(submission(), ctx({ existing: [decided] }));
    expect(r).toEqual({ outcome: "already_decided", existing: { id: "cand-1", status: "rejected", reason: "Too general." } });
  });
});

describe("runIntakePipeline — attribution, source policy and shape", () => {
  it("EVAL: rejects an unattributed item", () => {
    expect(rejectedCodes(submission({ author: "   " }))).toContain("unattributed");
  });

  it("rejects content not confirmed as publicly available", () => {
    expect(rejectedCodes(submission({ publicly_available: false }))).toContain("not_public");
  });

  it("rejects links that are not http(s), and notes too short to say anything", () => {
    for (const url of ["javascript:alert(1)", "ftp://example.org/x", "https://localhost/x", "not a url"]) {
      expect(rejectedCodes(submission({ url }))).toContain("invalid_url");
    }
    expect(rejectedCodes(submission({ note: "Great post." }))).toContain("note_too_short");
  });

  it("rejects a published date in the future, or one that is not a real date", () => {
    expect(rejectedCodes(submission({ published: "2026-11-10" }))).toContain("published_in_future");
    expect(rejectedCodes(submission({ published: "2026-02-30" }))).toContain("invalid_published_date");
    expect(accepted(submission({ published: "2026-11-09" })).published).toBe("2026-11-09");
  });

  it("reports every problem at once rather than one per attempt", () => {
    expect(rejectedCodes(submission({ author: "", publicly_available: false, note: "Short." }))).toEqual(
      expect.arrayContaining(["unattributed", "not_public", "note_too_short"]),
    );
  });
});

describe("runIntakePipeline — EVAL: an unverifiable regulation claim is flagged and held as a practitioner view", () => {
  it("flags a citation the catalogue does not hold, and keeps the item a practitioner view", () => {
    const c = accepted(
      submission({ note: "Regulation 99 says every home must publish its staffing ratios each week, and Reg 44 checks it." }),
    );
    expect(c.flags).toContain("unverified_regulation_claim");
    expect(c.claim_basis).toBe("practitioner_view");
    expect(c.regulation_refs).toEqual([
      { ref: "Regulation 99", verified: false },
      { ref: "Regulation 44", verified: true },
    ]);
  });

  it("does not read the title of the 2015 Regulations as a citation", () => {
    expect(extractRegulationNumbers("The Children's Homes (England) Regulations 2015 set the duties.")).toEqual([]);
    expect(extractRegulationNumbers("regs 44 and 45, plus Reg. 40(4)")).toEqual([44, 45, 40]);
  });

  it("flags a note that speaks for Ofsted, and one that mentions paid toolkits", () => {
    const c = accepted(
      submission({ note: "Ofsted expects every review to name the impact on the child; the full toolkit has templates." }),
    );
    expect(c.flags).toEqual(expect.arrayContaining(["ofsted_position_claim", "possible_commercial_content"]));
  });
});

describe("runIntakePipeline — the watchlist gate", () => {
  function voice(overrides: Partial<TrustedVoice>): TrustedVoice {
    return {
      id: "tv-1",
      name: "Sam Fieldwell",
      channels: [],
      domains: ["reg-45"],
      tier: 2,
      rationale: "Anchors posts to named regulations and shows worked evaluation.",
      tier_tests: {
        anchors_to_duties: true,
        verifiable_experience: true,
        original_work: true,
        fits_english_residential_care: true,
      },
      added_by: "curator-fixture",
      added_at: "2026-11-09",
      review_due: "2027-02-09",
      permission: { status: "agreed", how: "email reply", recorded_by: "curator-fixture", recorded_at: "2026-11-09" },
      active: true,
      opted_out: false,
      ...overrides,
    };
  }

  it("carries an agreed voice's tier onto the candidate", () => {
    const c = accepted(submission(), ctx({ voices: [voice({})] }));
    expect(c.tier).toBe(2);
    expect(c.voice_id).toBe("tv-1");
  });

  it("holds back an opted-out practitioner and a listed one who has not agreed", () => {
    expect(rejectedCodes(submission(), ctx({ voices: [voice({ opted_out: true, opted_out_at: "2026-11-09" })] }))).toEqual([
      "voice_blocked",
    ]);
    expect(rejectedCodes(submission(), ctx({ voices: [voice({ permission: { status: "asked" } })] }))).toEqual([
      "voice_blocked",
    ]);
  });
});

describe("canonicaliseUrl", () => {
  it("collapses LinkedIn's URL shapes for one post to its activity id", () => {
    const a = canonicaliseUrl(POST_URL);
    const b = canonicaliseUrl("https://linkedin.com/feed/update/urn%3Ali%3Aactivity%3A7123456789012345678/");
    expect(a?.key).toBe("linkedin:activity:7123456789012345678");
    expect(b?.key).toBe(a?.key);
  });

  it("drops fragments and tracking, sorts the query, and keeps meaningful parameters", () => {
    const c = canonicaliseUrl("https://WWW.Example.org/blog/post/?b=2&utm_campaign=x&a=1#section");
    expect(c).toEqual({
      url: "https://example.org/blog/post?a=1&b=2",
      key: "example.org/blog/post?a=1&b=2",
      host: "example.org",
      platform: "example.org",
    });
  });
});
