import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children?: React.ReactNode; href?: string }) =>
    React.createElement("a", { href }, children),
}));

vi.mock("@tanstack/react-query", () => ({ useQuery: vi.fn() }));

import { useQuery } from "@tanstack/react-query";
import { ManagerPracticeOversightCard } from "../manager-practice-oversight-card";

const m = (fn: unknown) => fn as unknown as Mock;
const html = () => renderToStaticMarkup(React.createElement(ManagerPracticeOversightCard));
const loading = { data: undefined, isLoading: true };

// Both panels call useQuery() directly (the wrappers were inlined 2026-07-25);
// a single mockReturnValue would feed the same shape to both, so SopPanel would
// see org-risk data and OrgRiskPanel would see SOP data — either throws on the
// first field it dereferences. Dispatch on the queryKey so each panel gets its
// own shape, and default to `loading` for any panel a given test doesn't set.
type PanelData = Record<string, unknown>;
const shapes: Partial<Record<string, PanelData>> = {};

function setPanel(key: "sop-reality-check" | "org-risk", data: unknown) {
  shapes[key] = { isLoading: false, data } as PanelData;
}

beforeEach(() => {
  for (const k of Object.keys(shapes)) delete shapes[k];
  m(useQuery).mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = String(opts.queryKey[0]);
    return shapes[key] ?? loading;
  });
});

describe("ManagerPracticeOversightCard", () => {
  it("renders both panels without throwing in the loading state", () => {
    expect(() => html()).not.toThrow();
  });

  it("SOP: surfaces evidence strength + inspection-risk count", () => {
    setPanel("sop-reality-check", { headline: "h", overallConfidence: "limited", areasStrong: 3, areasDeveloping: 2, areasLimited: 2, inspectionRisks: [{ area: "a", label: "l", detail: "d" }], areas: [] });
    const out = html();
    expect(out).toContain("Limited");
    expect(out).toContain("inspection-risk");
  });

  it("Org Risk: maps the engine level to its label (critical)", () => {
    setPanel("org-risk", { generatedAt: "", overallLevel: "critical", headline: "supporting the team", indicators: [{ key: "k", label: "l", value: "v", level: "critical", detail: "d" }], correlations: [], trend: [] });
    const out = html();
    expect(out).toContain("Critical");
    expect(out).toContain("supporting the team");
  });

  it("empty states are neutral, not red", () => {
    setPanel("sop-reality-check", undefined);
    setPanel("org-risk", undefined);
    const out = html();
    expect(out).toContain("No SOP data yet");
    expect(out).toContain("No risk data yet");
  });
});
