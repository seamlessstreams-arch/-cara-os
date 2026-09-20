// ══════════════════════════════════════════════════════════════════════════════
// A CHILD IS NEVER NAMED BY THEIR DATABASE ID
//
// From the live Command Centre, on the safeguarding panel:
//   "No daily log on record for 44aeb910-4a20-4e90-bc66-2233080fc56e."
// That record holds WESLEY and LOWE. The caller was `preferred_name ?? c.id`.
//
// Oak House also held a record whose preferred_name was literally "." — which
// `??` passed through happily, because "." is neither null nor undefined.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { childDisplayName } from "../child-display-name";

const UUID = "44aeb910-4a20-4e90-bc66-2233080fc56e";

describe("the name staff actually see", () => {
  it("uses the preferred name when there is one", () => {
    expect(childDisplayName({ preferred_name: "Wes", first_name: "WESLEY", last_name: "LOWE" })).toBe("Wes");
  });

  it("THE INCIDENT: falls back to first + last, never the id", () => {
    const name = childDisplayName({ preferred_name: null, first_name: "WESLEY", last_name: "LOWE" });
    expect(name).toBe("WESLEY LOWE");
    expect(name).not.toContain(UUID);
  });

  it("copes with only one of the two names", () => {
    expect(childDisplayName({ first_name: "WESLEY" })).toBe("WESLEY");
    expect(childDisplayName({ last_name: "LOWE" })).toBe("LOWE");
  });

  it("uses full_name when the parts are missing", () => {
    expect(childDisplayName({ full_name: "Wesley Lowe" })).toBe("Wesley Lowe");
  });
});

describe("blank and junk values are not names", () => {
  it('ignores a preferred_name of "." — a real record from a live home', () => {
    expect(childDisplayName({ preferred_name: ".", first_name: "wesley", last_name: "lowe" })).toBe("wesley lowe");
  });

  it("ignores empty and whitespace-only values, which ?? let through", () => {
    expect(childDisplayName({ preferred_name: "", first_name: "WESLEY" })).toBe("WESLEY");
    expect(childDisplayName({ preferred_name: "   ", first_name: "WESLEY" })).toBe("WESLEY");
  });

  it("ignores punctuation-only values at every level", () => {
    expect(childDisplayName({ preferred_name: "-", first_name: "..", last_name: "  " })).toBe("Unnamed child");
  });

  it("trims", () => {
    expect(childDisplayName({ first_name: "  WESLEY  ", last_name: " LOWE " })).toBe("WESLEY LOWE");
  });
});

describe("when there is no name at all", () => {
  it("says so, rather than showing an identifier", () => {
    expect(childDisplayName({})).toBe("Unnamed child");
    expect(childDisplayName(null)).toBe("Unnamed child");
    expect(childDisplayName(undefined)).toBe("Unnamed child");
  });

  it("never returns something that looks like a uuid", () => {
    const uuidish = /[0-9a-f]{8}-[0-9a-f]{4}-/i;
    for (const child of [{}, { preferred_name: "" }, { first_name: null, last_name: null }]) {
      expect(childDisplayName(child)).not.toMatch(uuidish);
    }
  });

  it("honours a caller's own fallback", () => {
    expect(childDisplayName({}, "This child")).toBe("This child");
  });
});
