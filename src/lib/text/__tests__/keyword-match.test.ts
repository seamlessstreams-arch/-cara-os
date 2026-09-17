import { describe, it, expect } from "vitest";
import {
  mentionsAny,
  mentions,
  mentionsAnyStemUnnegated,
  mentionsAnyUnnegated,
} from "../keyword-match";

describe("mentionsAny / mentions — word-boundary keyword matching", () => {
  it("matches whole words and their plurals, NOT substrings", () => {
    // the exact false-positives this fixes
    expect(mentions("an older male was seen", "older")).toBe(true);
    expect(mentions("found in a folder", "older")).toBe(false);
    expect(mentions("hanging out with mates", "mate")).toBe(true);
    expect(mentions("a warm climate", "mate")).toBe(false);
    expect(mentions("estimate of cost", "mate")).toBe(false);
    expect(mentions("self harm recorded", "harm")).toBe(true);
    expect(mentions("collected from the pharmacy", "harm")).toBe(false);
    expect(mentions("harmless banter", "harm")).toBe(false);
  });

  it("handles short risk tokens (man/men) without matching common words", () => {
    expect(mentions("an unknown man", "man")).toBe(true);
    expect(mentions("management meeting", "man")).toBe(false);
    expect(mentions("a woman visited", "man")).toBe(false);
    expect(mentions("the men outside", "men")).toBe(true);
    expect(mentions("women's group", "men")).toBe(false);
    expect(mentions("comment from staff", "men")).toBe(false);
  });

  it("matches multi-word phrases literally", () => {
    expect(mentions("an unknown male approached", "unknown male")).toBe(true);
    expect(mentions("male, unknown to staff", "unknown male")).toBe(false);
  });

  it("mentionsAny returns true if ANY word matches; false on empty", () => {
    expect(mentionsAny("had a brisk walk", ["risk", "harm", "concern"])).toBe(false);
    expect(mentionsAny("a real concern was raised", ["risk", "harm", "concern"])).toBe(true);
    expect(mentionsAny("", ["x"])).toBe(false);
    expect(mentionsAny(null, ["x"])).toBe(false);
  });
});

describe("mentionsAnyStemUnnegated — stem match + clause-negation", () => {
  it("keeps stem matching intact (one keyword catches its variants)", () => {
    // the whole point of a stem: "exploit" must catch exploitation/exploited/exploiting
    expect(mentionsAnyStemUnnegated("exploitation was suspected", ["exploit"])).toBe(true);
    expect(mentionsAnyStemUnnegated("the child was exploited online", ["exploit"])).toBe(true);
    expect(mentionsAnyStemUnnegated("clear signs of grooming", ["groom"])).toBe(true);
    expect(mentionsAnyStemUnnegated("he was being groomed", ["groom"])).toBe(true);
  });

  it("does NOT raise a flag inside a negated clause", () => {
    expect(mentionsAnyStemUnnegated("no exploitation concerns at all", ["exploit"])).toBe(false);
    expect(mentionsAnyStemUnnegated("no signs of exploitation", ["exploit"])).toBe(false);
    expect(mentionsAnyStemUnnegated("denied being groomed by anyone", ["groom"])).toBe(false);
    expect(mentionsAnyStemUnnegated("no drugs or alcohol involved", ["drug", "alcohol"])).toBe(false);
    expect(mentionsAnyStemUnnegated("staff have no concerns about grooming", ["groom"])).toBe(false);
  });

  it("negation is clause-local — an earlier clause's denial does not suppress a later hit", () => {
    // "no" belongs to the first clause; exploitation in the second must still raise
    expect(
      mentionsAnyStemUnnegated("no concerns raised; exploitation later suspected", ["exploit"]),
    ).toBe(true);
  });

  it("false on empty / no match", () => {
    expect(mentionsAnyStemUnnegated("", ["exploit"])).toBe(false);
    expect(mentionsAnyStemUnnegated(null, ["exploit"])).toBe(false);
    expect(mentionsAnyStemUnnegated("a calm afternoon walk", ["exploit", "groom"])).toBe(false);
  });
});

describe("mentionsAnyUnnegated — whole-word match + clause-negation", () => {
  it("keeps whole-word discipline (no substring false-positives)", () => {
    expect(mentionsAnyUnnegated("an older male was seen", ["older"])).toBe(true);
    expect(mentionsAnyUnnegated("found in a folder", ["older"])).toBe(false);
    expect(mentionsAnyUnnegated("hanging out with mates", ["mate"])).toBe(true); // plural
    expect(mentionsAnyUnnegated("a warm climate", ["mate"])).toBe(false);
  });

  it("does NOT raise a flag inside a negated clause", () => {
    expect(mentionsAnyUnnegated("no older males around", ["older"])).toBe(false);
    expect(mentionsAnyUnnegated("denies any unknown adult contact", ["unknown adult"])).toBe(false);
    expect(mentionsAnyUnnegated("an unknown adult was present", ["unknown adult"])).toBe(true);
  });
});
