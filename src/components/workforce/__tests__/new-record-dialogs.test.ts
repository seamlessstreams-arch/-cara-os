import { describe, it, expect } from "vitest";
import { optional, lines } from "@/components/workforce/new-record-dialogs";

// The two helpers that decide what a workforce create actually asserts.
//
// Both exist because of the same rule: a field the user did not fill must not
// arrive at the record as a value. accident-book's dialog posted thirteen
// blank strings and toasted success (#930) — the record then read as "recorded,
// and it is nothing" rather than "not recorded", which is what every count and
// compliance denominator downstream then believed.

describe("optional() — a skipped field is absent, not empty", () => {
  it("drops keys the user left blank", () => {
    expect(optional({ awarding_body: "", level: "", notes: "" })).toEqual({});
  });

  it("drops whitespace-only entries — a space bar is not a value", () => {
    expect(optional({ notes: "   ", level: "\t\n" })).toEqual({});
  });

  it("keeps and trims what the user did type", () => {
    expect(optional({ awarding_body: "  NCFE CACHE  ", level: "3" })).toEqual({
      awarding_body: "NCFE CACHE",
      level: "3",
    });
  });

  it("keeps filled fields while dropping blank ones in the same payload", () => {
    expect(optional({ awarding_body: "NCFE", level: "", notes: "  " })).toEqual({
      awarding_body: "NCFE",
    });
  });

  it("never invents a key that was not offered", () => {
    expect(Object.keys(optional({}))).toHaveLength(0);
  });
});

describe("lines() — a blank line is not a strength", () => {
  it("splits one entry per line", () => {
    expect(lines("Calm under pressure\nExplained the plan clearly")).toEqual([
      "Calm under pressure",
      "Explained the plan clearly",
    ]);
  });

  it("discards blank and whitespace-only lines rather than recording them", () => {
    expect(lines("First\n\n   \nSecond\n")).toEqual(["First", "Second"]);
  });

  it("an empty textarea yields no entries, not one empty entry", () => {
    expect(lines("")).toEqual([]);
    expect(lines("   \n  ")).toEqual([]);
  });

  it("trims each entry", () => {
    expect(lines("  padded  \n\tindented")).toEqual(["padded", "indented"]);
  });
});
