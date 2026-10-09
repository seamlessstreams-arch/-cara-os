import { describe, it, expect } from "vitest";
import { draftRiskThemes } from "../profile-autodraft";

// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO — learning-profile auto-draft: risk-theme derivation
//
// Themes come from the incident TYPE (a controlled field), never the free-text
// description — on live, descriptions are often pasted form templates full of
// category labels, which over-matched (one incident → seven themes). Locks:
// type-based mapping, word-boundary matching, frequency ordering, honest-empty.
// ══════════════════════════════════════════════════════════════════════════════

describe("draftRiskThemes", () => {
  it("maps incident types to the curriculum risk-theme vocabulary", () => {
    const themes = draftRiskThemes([
      { type: "missing_from_care" },
      { type: "physical_assault" },
      { type: "substance_use" },
    ]);
    expect(themes).toContain("missing");
    expect(themes).toContain("violence");
    expect(themes).toContain("substance");
  });

  it("a single missing-from-care incident implies exactly one theme (live regression)", () => {
    // WESLEY's one incident is type missing_from_care with a form-template
    // description; the old free-text scan produced seven themes. Type-led = one.
    expect(draftRiskThemes([{ type: "missing_from_care" }])).toEqual(["missing"]);
  });

  it("orders themes by frequency, most frequent first", () => {
    const themes = draftRiskThemes([
      { type: "missing_from_care" },
      { type: "missing_from_care" },
      { type: "substance_use" },
    ]);
    expect(themes[0]).toBe("missing");
  });

  it("does not false-match a keyword inside an unrelated type (word-boundary)", () => {
    // "commissioning_review" contains the substring "missi…" but must NOT imply "missing".
    expect(draftRiskThemes([{ type: "commissioning_review" }])).not.toContain("missing");
  });

  it("returns an empty list when nothing matches (never fabricates a theme)", () => {
    expect(draftRiskThemes([])).toEqual([]);
    expect(draftRiskThemes([{ type: "keywork_session" }])).toEqual([]);
  });
});
