import { describe, it, expect } from "vitest";
import { mentionsAny, mentions } from "../keyword-match";

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
