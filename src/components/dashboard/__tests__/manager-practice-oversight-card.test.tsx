import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children?: React.ReactNode; href?: string }) =>
    React.createElement("a", { href }, children),
}));

vi.mock("@/hooks/use-sop-reality-check", () => ({ useSopRealityCheck: vi.fn() }));
vi.mock("@/hooks/use-org-risk", () => ({ useOrgRisk: vi.fn() }));

import { useSopRealityCheck } from "@/hooks/use-sop-reality-check";
import { useOrgRisk } from "@/hooks/use-org-risk";
import { ManagerPracticeOversightCard } from "../manager-practice-oversight-card";

const m = (fn: unknown) => fn as unknown as Mock;
const html = () => renderToStaticMarkup(React.createElement(ManagerPracticeOversightCard));
const loading = { data: undefined, isLoading: true };

beforeEach(() => {
  m(useSopRealityCheck).mockReturnValue(loading);
  m(useOrgRisk).mockReturnValue(loading);
});

describe("ManagerPracticeOversightCard", () => {
  it("renders both panels without throwing in the loading state", () => {
    expect(() => html()).not.toThrow();
  });

  it("SOP: surfaces evidence strength + inspection-risk count", () => {
    m(useSopRealityCheck).mockReturnValue({
      isLoading: false,
      data: { headline: "h", overallConfidence: "limited", areasStrong: 3, areasDeveloping: 2, areasLimited: 2, inspectionRisks: [{ area: "a", label: "l", detail: "d" }], areas: [] },
    });
    const out = html();
    expect(out).toContain("Limited");
    expect(out).toContain("inspection-risk");
  });

  it("Org Risk: maps the engine level to its label (critical)", () => {
    m(useOrgRisk).mockReturnValue({
      isLoading: false,
      data: { generatedAt: "", overallLevel: "critical", headline: "supporting the team", indicators: [{ key: "k", label: "l", value: "v", level: "critical", detail: "d" }], correlations: [], trend: [] },
    });
    const out = html();
    expect(out).toContain("Critical");
    expect(out).toContain("supporting the team");
  });

  it("empty states are neutral, not red", () => {
    m(useSopRealityCheck).mockReturnValue({ isLoading: false, data: undefined });
    m(useOrgRisk).mockReturnValue({ isLoading: false, data: undefined });
    const out = html();
    expect(out).toContain("No SOP data yet");
    expect(out).toContain("No risk data yet");
  });
});
