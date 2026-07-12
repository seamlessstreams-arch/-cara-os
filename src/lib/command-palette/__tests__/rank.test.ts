import { describe, it, expect } from "vitest";
import { matchScore, rankEntries, emptyQueryEntries, type PaletteEntry } from "../rank";
import { buildPaletteEntries, buildPageEntries } from "../entries";
import { NAV_GROUPS, GLOBAL_CREATE_ITEMS } from "@/config/navigation";

const E = (over: Partial<PaletteEntry> & Pick<PaletteEntry, "id" | "label" | "href" | "kind">): PaletteEntry => ({
  keywords: [],
  ...over,
});

const FIXTURES: PaletteEntry[] = [
  E({ id: "page:/medication", label: "Medication", href: "/medication", kind: "page", hint: "Children › Medication" }),
  E({ id: "page:/safe-staffing", label: "Safe Staffing", href: "/safe-staffing", kind: "page", hint: "Today › Safe Staffing" }),
  E({ id: "page:/safeguarding", label: "Safeguarding", href: "/safeguarding", kind: "page" }),
  E({ id: "page:/missing-from-care", label: "Missing from Care", href: "/missing-from-care", kind: "page" }),
  E({ id: "action:incident", label: "New: Incident", href: "/incidents", kind: "action", keywords: ["incident", "create", "log"] }),
  E({ id: "page:/incidents", label: "Incidents", href: "/incidents", kind: "page" }),
  E({ id: "child:yp_alex", label: "Alex Thompson", href: "/young-people/yp_alex", kind: "child", keywords: ["Alex", "Thompson"] }),
  E({ id: "staff:s1", label: "Alexandra Reid", href: "/staff/s1", kind: "staff", keywords: ["Alexandra", "Reid"] }),
];

describe("matchScore", () => {
  it("orders exact > prefix > word-start > substring > fuzzy", () => {
    const exact = matchScore("medication", "Medication");
    const prefix = matchScore("medi", "Medication");
    const wordStart = matchScore("staff", "Safe Staffing");
    const substring = matchScore("cation", "Medication");
    const fuzzy = matchScore("medcation", "Medication");
    expect(exact).toBeGreaterThan(prefix);
    expect(prefix).toBeGreaterThan(wordStart);
    expect(wordStart).toBeGreaterThan(substring);
    expect(substring).toBeGreaterThan(fuzzy);
    expect(fuzzy).toBeGreaterThan(0);
  });

  it("returns 0 when characters are not a subsequence", () => {
    expect(matchScore("xyz", "Medication")).toBe(0);
  });
});

describe("rankEntries", () => {
  it("typo still finds Medication via fuzzy subsequence", () => {
    const r = rankEntries(FIXTURES, "medcation");
    expect(r[0]?.entry.label).toBe("Medication");
  });

  it("every term must match: 'miss care' → Missing from Care only", () => {
    const r = rankEntries(FIXTURES, "miss care");
    expect(r.map((x) => x.entry.label)).toEqual(["Missing from Care"]);
  });

  it("a child outranks a page on a name-like query", () => {
    const r = rankEntries(FIXTURES, "alex");
    expect(r[0]?.entry.kind).toBe("child");
    expect(r[0]?.entry.label).toBe("Alex Thompson");
    // staff second (alexandra is a prefix match too, lower kind boost)
    expect(r[1]?.entry.kind).toBe("staff");
  });

  it("recents boost floats a recently used entry", () => {
    const base = rankEntries(FIXTURES, "in");
    const boosted = rankEntries(FIXTURES, "in", { recents: ["page:/incidents"] });
    const basePos = base.findIndex((x) => x.entry.id === "page:/incidents");
    const boostedPos = boosted.findIndex((x) => x.entry.id === "page:/incidents");
    expect(boostedPos).toBeLessThanOrEqual(basePos);
    expect(boostedPos).toBe(0);
  });

  it("is deterministic and respects the limit", () => {
    const a = rankEntries(FIXTURES, "a", { limit: 3 });
    const b = rankEntries(FIXTURES, "a", { limit: 3 });
    expect(a).toEqual(b);
    expect(a.length).toBeLessThanOrEqual(3);
  });

  it("empty query returns nothing (component shows recents/starters)", () => {
    expect(rankEntries(FIXTURES, "   ")).toEqual([]);
  });
});

describe("emptyQueryEntries", () => {
  it("recents first (in order), then starters, deduped + capped", () => {
    const out = emptyQueryEntries(FIXTURES, ["page:/medication", "child:yp_alex", "missing-id"], 5);
    expect(out[0]?.id).toBe("page:/medication");
    expect(out[1]?.id).toBe("child:yp_alex");
    expect(out.length).toBe(5);
    expect(new Set(out.map((e) => e.id)).size).toBe(5);
  });
});

describe("entry builders over the real catalogues", () => {
  it("builds hundreds of deduped page entries from NAV_GROUPS", () => {
    const pages = buildPageEntries(NAV_GROUPS);
    expect(pages.length).toBeGreaterThan(400);
    const hrefs = pages.map((p) => p.href);
    expect(new Set(hrefs).size).toBe(hrefs.length); // deduped
  });

  it("full build indexes pages + actions + people and finds a real page", () => {
    const all = buildPaletteEntries({
      navGroups: NAV_GROUPS,
      createItems: GLOBAL_CREATE_ITEMS,
      children: [{ id: "yp_alex", name: "Alex Thompson", aliases: ["Alex"] }],
      staff: [{ id: "staff_darren", name: "Olivia Hayes", aliases: ["Olivia", "Hayes"] }],
    });
    expect(all.length).toBeGreaterThan(500);
    const r = rankEntries(all, "priority briefing");
    expect(r[0]?.entry.href).toBe("/priority-briefing");
    // an action query hits the create catalogue
    const inc = rankEntries(all, "new incident");
    expect(inc[0]?.entry.kind).toBe("action");
  });
});
