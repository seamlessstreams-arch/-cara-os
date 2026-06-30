import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// next/link needs router context it won't have under renderToStaticMarkup — stub to a plain <a>.
vi.mock("next/link", () => ({
  default: ({ children, href }: { children?: React.ReactNode; href?: string }) =>
    React.createElement("a", { href }, children),
}));

// Mock each module's per-child hook so we can drive the panels with controlled data.
vi.mock("@/hooks/use-rights-restriction", () => ({ useChildRestrictions: vi.fn() }));
vi.mock("@/hooks/use-staying-safe-plan", () => ({ useChildStayingSafePlan: vi.fn() }));
vi.mock("@/hooks/use-protective-relationships", () => ({ useChildRelationships: vi.fn() }));
vi.mock("@/hooks/use-post-incident-reflection", () => ({ useChildReflections: vi.fn() }));

import { useChildRestrictions } from "@/hooks/use-rights-restriction";
import { useChildStayingSafePlan } from "@/hooks/use-staying-safe-plan";
import { useChildRelationships } from "@/hooks/use-protective-relationships";
import { useChildReflections } from "@/hooks/use-post-incident-reflection";
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
  // Default every hook to the loading state; each test overrides what it needs.
  m(useChildRestrictions).mockReturnValue(loading);
  m(useChildStayingSafePlan).mockReturnValue(loading);
  m(useChildRelationships).mockReturnValue(loading);
  m(useChildReflections).mockReturnValue(loading);
});

describe("practice-module-panels — no-false-red invariant", () => {
  it("Relationships: an UNMAPPED child shows neutral 'no data', never the fragile red", () => {
    // Engine returns status 'fragile' but there are zero mapped relationships:
    // that is 'no data', not a concern. The panel must NOT surface 'Fragile'.
    m(useChildRelationships).mockReturnValue({
      isLoading: false,
      data: { childId: "yp_alex", childName: "Alex", entries: [], analysis: { status: "fragile", protectiveCount: 0, riskCount: 0, neutralCount: 0, trustedAdultCount: 0, flags: [] } },
    });
    const out = html(React.createElement(RelationshipsPanel, { childId: "yp_alex" }));
    expect(out).toContain("No relationships mapped yet");
    expect(out).not.toContain("Fragile");
  });

  it("Relationships: once relationships ARE mapped, the engine RAG status shows", () => {
    m(useChildRelationships).mockReturnValue({
      isLoading: false,
      data: { childId: "yp_alex", childName: "Alex", entries: [{ id: "r1" }], analysis: { status: "fragile", protectiveCount: 1, riskCount: 2, neutralCount: 0, trustedAdultCount: 1, flags: [] } },
    });
    const out = html(React.createElement(RelationshipsPanel, { childId: "yp_alex" }));
    expect(out).toContain("Fragile");
    expect(out).not.toContain("No relationships mapped yet");
  });

  it("Staying Safe Plan: no plan → neutral 'no plan yet' (not a red alert)", () => {
    m(useChildStayingSafePlan).mockReturnValue({ isLoading: false, data: { childId: "yp_alex", childName: "Alex", plan: null, analysis: null } });
    const out = html(React.createElement(StayingSafePanel, { childId: "yp_alex" }));
    expect(out).toContain("No Staying Safe Plan yet");
  });

  it("Staying Safe Plan: with a plan → completeness summary", () => {
    m(useChildStayingSafePlan).mockReturnValue({
      isLoading: false,
      data: { childId: "yp_alex", childName: "Alex", plan: { id: "p1" }, analysis: { completenessPct: 90, needsAttention: false, flags: [] } },
    });
    const out = html(React.createElement(StayingSafePanel, { childId: "yp_alex" }));
    expect(out).toContain("90%");
    expect(out).not.toContain("No Staying Safe Plan yet");
  });

  it("Rights & Restriction: no reviews → neutral empty state", () => {
    m(useChildRestrictions).mockReturnValue({ isLoading: false, data: { childId: "yp_alex", childName: "Alex", reviews: [] } });
    const out = html(React.createElement(RightsRestrictionPanel, { childId: "yp_alex" }));
    expect(out).toContain("No restriction reviews recorded");
  });

  it("Rights & Restriction: surfaces manager-attention count when present", () => {
    m(useChildRestrictions).mockReturnValue({
      isLoading: false,
      data: { childId: "yp_alex", childName: "Alex", reviews: [{ review: {}, analysis: { needsManagerAttention: true, flags: [] } }] },
    });
    const out = html(React.createElement(RightsRestrictionPanel, { childId: "yp_alex" }));
    expect(out).toContain("need manager attention");
  });

  it("Reflection: no reflections → neutral empty state", () => {
    m(useChildReflections).mockReturnValue({ isLoading: false, data: { childId: "yp_alex", childName: "Alex", reflections: [] } });
    const out = html(React.createElement(ReflectionPanel, { childId: "yp_alex" }));
    expect(out).toContain("No reflections recorded");
  });

  it("the highest-severity flag is the one surfaced", () => {
    m(useChildStayingSafePlan).mockReturnValue({
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
