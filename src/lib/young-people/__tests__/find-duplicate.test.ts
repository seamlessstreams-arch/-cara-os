import { describe, it, expect } from "vitest";
import { findLikelyDuplicates, type ExistingChildLike } from "../find-duplicate";

const existing: ExistingChildLike[] = [
  { id: "a", first_name: "WESLEY", last_name: "LOWE", date_of_birth: "0014-10-10", status: "current" },
  { id: "b", first_name: "wesley", last_name: "lowe", date_of_birth: "0001-01-05", status: "ended" },
  { id: "c", first_name: "Jordan", last_name: "Smith", date_of_birth: "2009-03-01", status: "current" },
];

describe("findLikelyDuplicates", () => {
  it("matches on name even when DOBs differ (the real go-live duplicate class)", () => {
    const hits = findLikelyDuplicates(existing, { first_name: "Wesley", last_name: "Lowe", date_of_birth: "2010-05-05" });
    expect(hits.map((h) => h.id).sort()).toEqual(["a", "b"]);
    expect(hits.every((h) => h.dob_matches === false)).toBe(true);
  });

  it("flags dob_matches when the date of birth also lines up", () => {
    const hits = findLikelyDuplicates(existing, { first_name: "wesley", last_name: "LOWE", date_of_birth: "0014-10-10" });
    expect(hits.find((h) => h.id === "a")?.dob_matches).toBe(true);
    expect(hits.find((h) => h.id === "b")?.dob_matches).toBe(false);
  });

  it("is case- and spacing-insensitive", () => {
    expect(findLikelyDuplicates(existing, { first_name: "  jordan ", last_name: "smith" }).map((h) => h.id)).toEqual(["c"]);
  });

  it("returns nothing for a different name", () => {
    expect(findLikelyDuplicates(existing, { first_name: "Alex", last_name: "Brown" })).toEqual([]);
  });

  it("does not warn on a half-typed form (missing first or last name)", () => {
    expect(findLikelyDuplicates(existing, { first_name: "Wesley", last_name: "" })).toEqual([]);
    expect(findLikelyDuplicates(existing, { first_name: "", last_name: "Lowe" })).toEqual([]);
  });
});
