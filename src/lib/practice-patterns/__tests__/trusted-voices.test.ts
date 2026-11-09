import { describe, it, expect } from "vitest";
import {
  TIER_TESTS,
  addMonthsIso,
  findMatchingVoices,
  gateVoice,
  isIsoDate,
  isReviewOverdue,
  nextQuarterlyReview,
  normaliseName,
  validateTrustedVoice,
  voiceMatchesUrl,
  type TrustedVoice,
} from "../trusted-voices";
import { PATTERN_DOMAIN_LIST, isPatternDomain, tagDomains } from "../domains";

// Fictional practitioner — no real person is named in any fixture.
function voice(overrides: Partial<TrustedVoice> = {}): TrustedVoice {
  return {
    id: "tv_fixture_1",
    name: "Sam Fieldwell",
    role: "Practice consultant",
    organisation: "Example Practice Ltd",
    channels: [
      { kind: "newsletter", url: "https://samfieldwell.example.org/newsletter" },
      { kind: "profile", url: "https://www.linkedin.com/in/sam-fieldwell-0001" },
    ],
    domains: ["reg-45", "evidence-vs-evaluation"],
    tier: 1,
    rationale: "Anchors every post to a named regulation and shows worked evaluation, not activity lists.",
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

describe("validateTrustedVoice", () => {
  it("accepts a complete, agreed entry", () => {
    expect(validateTrustedVoice(voice())).toEqual({ ok: true, errors: [] });
  });

  it("EVAL: rejects an entry with no rationale", () => {
    const r = validateTrustedVoice(voice({ rationale: "   " }));
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/rationale/);
  });

  it("rejects a rationale too short to explain the tier", () => {
    const r = validateTrustedVoice(voice({ rationale: "Good." }));
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/explain the tier/);
  });

  it("EVAL: rejects an entry with no named curator", () => {
    const r = validateTrustedVoice(voice({ added_by: "" }));
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/curator/);
  });

  it("rejects a tier outside 1-3 and an unanswered tier test", () => {
    const tests = { ...voice().tier_tests } as Record<string, boolean>;
    delete tests.original_work;
    const r = validateTrustedVoice(voice({ tier: 4 as never, tier_tests: tests as TrustedVoice["tier_tests"] }));
    expect(r.errors).toContain("tier must be 1, 2 or 3");
    expect(r.errors).toContain('tier test "original_work" must be answered');
  });

  it("rejects unknown domains, non-http channels and impossible dates", () => {
    const r = validateTrustedVoice(
      voice({
        domains: ["reg-99" as never],
        channels: [{ kind: "blog", url: "javascript:alert(1)" }],
        added_at: "2026-02-30",
      }),
    );
    expect(r.errors.join(" | ")).toMatch(/unknown domain "reg-99"/);
    expect(r.errors.join(" | ")).toMatch(/not an http\(s\) link/);
    expect(r.errors.join(" | ")).toMatch(/added_at/);
  });

  it("requires review_due to fall after added_at", () => {
    const r = validateTrustedVoice(voice({ review_due: "2026-11-09" }));
    expect(r.errors).toContain("review_due must fall after added_at");
  });

  it("requires an agreement to record how, who and when", () => {
    const r = validateTrustedVoice(voice({ permission: { status: "agreed" } }));
    expect(r.errors).toEqual(
      expect.arrayContaining([
        "agreement must record how it was given",
        "agreement must record who recorded it",
        "agreement must record the date it was given",
      ]),
    );
  });

  it("requires an opt-out to carry its date", () => {
    const r = validateTrustedVoice(voice({ opted_out: true }));
    expect(r.errors).toContain("an opt-out must record its date");
  });

  it("keeps the four written tests as data", () => {
    expect(TIER_TESTS.map((t) => t.id)).toEqual([
      "anchors_to_duties",
      "verifiable_experience",
      "original_work",
      "fits_english_residential_care",
    ]);
    for (const t of TIER_TESTS) expect(t.question.length).toBeGreaterThan(10);
  });
});

describe("gateVoice", () => {
  it("lets an agreed, active voice through at its tier", () => {
    const g = gateVoice([voice({ tier: 2 })]);
    expect(g).toMatchObject({ allowed: true, tier: 2 });
  });

  it("EVAL: an opted-out voice never reaches the queue", () => {
    const g = gateVoice([voice({ opted_out: true, opted_out_at: "2026-11-10" })]);
    expect(g.allowed).toBe(false);
    if (!g.allowed) expect(g.reason).toMatch(/opted out/);
  });

  it("EVAL: a listed voice without recorded permission never reaches the queue (ask first)", () => {
    for (const status of ["not_asked", "asked"] as const) {
      const g = gateVoice([voice({ permission: { status } })]);
      expect(g.allowed).toBe(false);
      if (!g.allowed) expect(g.reason).toMatch(/not yet agreed/);
    }
  });

  it("blocks a decline or a withdrawal", () => {
    expect(gateVoice([voice({ permission: { status: "declined" } })]).allowed).toBe(false);
    expect(gateVoice([voice({ permission: { status: "withdrawn" } })]).allowed).toBe(false);
  });

  it("a 'no' wins even on a removed entry, and over another matching entry that agreed", () => {
    expect(gateVoice([voice({ active: false, opted_out: true, opted_out_at: "2026-11-10" })]).allowed).toBe(false);
    const g = gateVoice([voice({ id: "a" }), voice({ id: "b", permission: { status: "declined" } })]);
    expect(g.allowed).toBe(false);
  });

  it("an unlisted author enters untiered (a saved link is allowed by the source policy)", () => {
    expect(gateVoice([])).toEqual({ allowed: true, voice: null, tier: null });
  });

  it("a removed entry with no refusal behaves like an unlisted author", () => {
    expect(gateVoice([voice({ active: false, permission: { status: "asked" } })])).toEqual({
      allowed: true,
      voice: null,
      tier: null,
    });
  });
});

describe("matching an author to the watchlist", () => {
  it("matches names case-, accent- and honorific-insensitively, ignoring a role in brackets", () => {
    expect(normaliseName("Dr Sám  FIELDWELL (Director, Example Ltd)")).toBe("sam fieldwell");
    expect(findMatchingVoices([voice()], "sam fieldwell", "https://unrelated.example.com/x")).toHaveLength(1);
  });

  it("matches a LinkedIn post to the member's profile by vanity name only", () => {
    const v = voice();
    expect(voiceMatchesUrl(v, "https://www.linkedin.com/posts/sam-fieldwell-0001_reg45-activity-7123456789012345678-abcd")).toBe(true);
    expect(voiceMatchesUrl(v, "https://www.linkedin.com/posts/someone-else_reg45-activity-7123456789012345678-abcd")).toBe(false);
  });

  it("matches the practitioner's own domain, but needs a path match on shared platforms", () => {
    const v = voice({ channels: [{ kind: "blog", url: "https://medium.com/@samfieldwell" }] });
    expect(voiceMatchesUrl(voice(), "https://samfieldwell.example.org/2026/11/a-post")).toBe(true);
    expect(voiceMatchesUrl(v, "https://medium.com/@samfieldwell/a-post-123")).toBe(true);
    expect(voiceMatchesUrl(v, "https://medium.com/@another/a-post-123")).toBe(false);
  });
});

describe("dates", () => {
  it("validates real calendar dates", () => {
    expect(isIsoDate("2028-02-29")).toBe(true);
    expect(isIsoDate("2027-02-29")).toBe(false);
    expect(isIsoDate("2026-13-01")).toBe(false);
    expect(isIsoDate("09/11/2026")).toBe(false);
  });

  it("adds calendar months and clamps to the month end", () => {
    expect(addMonthsIso("2026-11-30", 3)).toBe("2027-02-28");
    expect(addMonthsIso("2026-12-15", 1)).toBe("2027-01-15");
    expect(nextQuarterlyReview("2026-11-09")).toBe("2027-02-09");
  });

  it("treats a review due today as not yet overdue", () => {
    expect(isReviewOverdue(voice({ review_due: "2027-02-09" }), "2027-02-09")).toBe(false);
    expect(isReviewOverdue(voice({ review_due: "2027-02-09" }), "2027-02-10")).toBe(true);
  });
});

describe("domain cues", () => {
  it("covers every domain and recognises its own members", () => {
    expect(PATTERN_DOMAIN_LIST).toHaveLength(17);
    for (const d of PATTERN_DOMAIN_LIST) expect(isPatternDomain(d)).toBe(true);
    expect(isPatternDomain("reg-99")).toBe(false);
  });

  it("tags on whole words, not substrings", () => {
    expect(tagDomains("Our Reg 45 review asks the so what question about impact on the child.")).toEqual(
      expect.arrayContaining(["reg-45", "evidence-vs-evaluation"]),
    );
    // "colado" must not fire LADO; "impactful" must not fire evaluation.
    expect(tagDomains("An impactful colado recipe.")).toEqual([]);
  });
});
