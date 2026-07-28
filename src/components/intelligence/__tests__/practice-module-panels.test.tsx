import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// next/link needs router context it won't have under renderToStaticMarkup — stub to a plain <a>.
vi.mock("next/link", () => ({
  default: ({ children, href }: { children?: React.ReactNode; href?: string }) =>
    React.createElement("a", { href }, children),
}));

// practice-module-panels now inlines each module's per-child query hook as a
// local, non-exported function (the hooks themselves were deleted), so there is
// no longer a per-hook module to mock. Every panel calls exactly one
// @tanstack/react-query useQuery under the hood, so mock at that shared
// boundary instead — still one controlled { data, isLoading } per render.
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return { ...actual, useQuery: vi.fn() };
});

import { useQuery } from "@tanstack/react-query";
import {
  RightsRestrictionPanel,
  StayingSafePanel,
  RelationshipsPanel,
  ReflectionPanel,
  InlinePracticeModules,
} from "../practice-module-panels";
import { ChildPracticeModulesCard } from "../child-practice-modules-card";

const m = (fn: unknown) => fn as unknown as Mock;
const html = (el: React.ReactElement) => renderToStaticMarkup(el);

const loading = { data: undefined, isLoading: true };

beforeEach(() => {
  // Default to the loading state; each test overrides what it needs. Every
  // panel under test calls useQuery exactly once, so one mock return covers it.
  m(useQuery).mockReturnValue(loading);
});

describe("practice-module-panels — no-false-red invariant", () => {
  it("Relationships: an UNMAPPED child shows neutral 'no data', never the fragile red", () => {
    // Engine returns status 'fragile' but there are zero mapped relationships:
    // that is 'no data', not a concern. The panel must NOT surface 'Fragile'.
    m(useQuery).mockReturnValue({
      isLoading: false,
      data: { childId: "yp_alex", childName: "Alex", entries: [], analysis: { status: "fragile", protectiveCount: 0, riskCount: 0, neutralCount: 0, trustedAdultCount: 0, flags: [] } },
    });
    const out = html(React.createElement(RelationshipsPanel, { childId: "yp_alex" }));
    expect(out).toContain("No relationships mapped yet");
    expect(out).not.toContain("Fragile");
  });

  it("Relationships: once relationships ARE mapped, the engine RAG status shows", () => {
    m(useQuery).mockReturnValue({
      isLoading: false,
      data: { childId: "yp_alex", childName: "Alex", entries: [{ id: "r1" }], analysis: { status: "fragile", protectiveCount: 1, riskCount: 2, neutralCount: 0, trustedAdultCount: 1, flags: [] } },
    });
    const out = html(React.createElement(RelationshipsPanel, { childId: "yp_alex" }));
    expect(out).toContain("Fragile");
    expect(out).not.toContain("No relationships mapped yet");
  });

  it("Staying Safe Plan: no plan → neutral 'no plan yet' (not a red alert)", () => {
    m(useQuery).mockReturnValue({ isLoading: false, data: { childId: "yp_alex", childName: "Alex", plan: null, analysis: null } });
    const out = html(React.createElement(StayingSafePanel, { childId: "yp_alex" }));
    expect(out).toContain("No Staying Safe Plan yet");
  });

  it("Staying Safe Plan: with a plan → completeness summary", () => {
    m(useQuery).mockReturnValue({
      isLoading: false,
      data: { childId: "yp_alex", childName: "Alex", plan: { id: "p1" }, analysis: { completenessPct: 90, needsAttention: false, flags: [] } },
    });
    const out = html(React.createElement(StayingSafePanel, { childId: "yp_alex" }));
    expect(out).toContain("90%");
    expect(out).not.toContain("No Staying Safe Plan yet");
  });

  it("Rights & Restriction: no reviews → neutral empty state", () => {
    m(useQuery).mockReturnValue({ isLoading: false, data: { childId: "yp_alex", childName: "Alex", reviews: [] } });
    const out = html(React.createElement(RightsRestrictionPanel, { childId: "yp_alex" }));
    expect(out).toContain("No restriction reviews recorded");
  });

  it("Rights & Restriction: surfaces manager-attention count when present", () => {
    m(useQuery).mockReturnValue({
      isLoading: false,
      data: { childId: "yp_alex", childName: "Alex", reviews: [{ review: {}, analysis: { needsManagerAttention: true, flags: [] } }] },
    });
    const out = html(React.createElement(RightsRestrictionPanel, { childId: "yp_alex" }));
    expect(out).toContain("need manager attention");
  });

  it("Reflection: no reflections → neutral empty state", () => {
    m(useQuery).mockReturnValue({ isLoading: false, data: { childId: "yp_alex", childName: "Alex", reflections: [] } });
    const out = html(React.createElement(ReflectionPanel, { childId: "yp_alex" }));
    expect(out).toContain("No reflections recorded");
  });

  it("the highest-severity flag is the one surfaced", () => {
    m(useQuery).mockReturnValue({
      isLoading: false,
      data: { childId: "yp_alex", childName: "Alex", plan: { id: "p1" }, analysis: { completenessPct: 50, needsAttention: true, flags: [
        { key: "a", severity: "info", message: "low signal note", why: "" },
        { key: "b", severity: "high", message: "high signal alert", why: "" },
      ] } },
    });
    const out = html(React.createElement(StayingSafePanel, { childId: "yp_alex" }));
    expect(out).toContain("high signal alert");
    expect(out).not.toContain("low signal note");
  });
});

describe("practice-module-panels — render smoke (catches browser-only throws)", () => {
  it("every panel mounts in the loading state without throwing", () => {
    expect(() => html(React.createElement(RightsRestrictionPanel, { childId: "yp_alex" }))).not.toThrow();
    expect(() => html(React.createElement(StayingSafePanel, { childId: "yp_alex" }))).not.toThrow();
    expect(() => html(React.createElement(RelationshipsPanel, { childId: "yp_alex" }))).not.toThrow();
    expect(() => html(React.createElement(ReflectionPanel, { childId: "yp_alex" }))).not.toThrow();
    expect(() => html(React.createElement(ChildPracticeModulesCard, { childId: "yp_alex" }))).not.toThrow();
  });

  it("InlinePracticeModules renders nothing until a child is chosen", () => {
    expect(html(React.createElement(InlinePracticeModules, { childId: undefined, modules: ["rights", "safe"] }))).toBe("");
  });

  it("InlinePracticeModules renders the requested modules once a child is set", () => {
    const out = html(React.createElement(InlinePracticeModules, { childId: "yp_alex", modules: ["rights", "relationships"] }));
    expect(out).toContain("practice context for this child");
  });
});
