import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import { parsePronouns, pronounsForGender, pronounsForChild } from "../pronouns";
import { getWeeklyNarrative } from "../get-weekly-report";

describe("CPIE — child pronouns from the record", () => {
  it("parses stated pronouns (the child's own words win)", () => {
    expect(parsePronouns("he/him")?.subject).toBe("he");
    expect(parsePronouns("She/Her")?.subject).toBe("she");
    expect(parsePronouns("they/them")?.subject).toBe("they");
    expect(parsePronouns("prefer not to say")).toBeNull();
  });

  it("maps unambiguous gender only; anything else stays they/them", () => {
    expect(pronounsForGender("Male")?.subject).toBe("he");
    expect(pronounsForGender("female")?.subject).toBe("she");
    expect(pronounsForGender("non_binary")).toBeNull();
    expect(pronounsForGender("")).toBeNull();
  });

  it("Alex's personal passport (he/him) drives his pronouns", () => {
    const p = pronounsForChild("yp_alex", getStore());
    expect(p.subject).toBe("he");
    expect(p.possessive).toBe("his");
  });

  it("an unknown child safely defaults to they/them", () => {
    expect(pronounsForChild("yp_nobody", getStore()).subject).toBe("they");
  });

  it("the weekly narrative now writes Alex with his real pronouns", () => {
    const n = getWeeklyNarrative("yp_alex", undefined, 14);
    expect(n?.body).toMatch(/\b(He|his|him)\b/);
    expect(n?.body).not.toContain("They enjoyed"); // the old they-default marker
  });
});
