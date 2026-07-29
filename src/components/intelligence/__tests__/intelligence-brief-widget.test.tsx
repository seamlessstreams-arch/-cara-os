import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children?: React.ReactNode; href?: string }) =>
    React.createElement("a", { href }, children),
}));

vi.mock("@tanstack/react-query", () => ({ useQuery: vi.fn() }));

import { useQuery } from "@tanstack/react-query";
import { IntelligenceBriefWidget } from "../intelligence-brief-widget";

const m = (fn: unknown) => fn as unknown as Mock;
const html = () => renderToStaticMarkup(React.createElement(IntelligenceBriefWidget));

// Four useQuery calls: "home-profile" (useHomeName), "intelligence.patterns"
// (usePatternAlerts), "intelligence.action-outcomes" (useActionOutcomes),
// "intelligence.home-climate" (useHomeClimate). All share the "intelligence"
// prefix so we dispatch on queryKey[1] to keep each addressable, and route
// "home-profile" separately.
type Shape = { isLoading: boolean; data: unknown };
const loading: Shape = { isLoading: true, data: undefined };
const shapes: Record<string, Shape> = {};

function setKey(key: "home-profile" | "patterns" | "action-outcomes" | "home-climate", data: unknown) {
  shapes[key] = { isLoading: false, data };
}

beforeEach(() => {
  for (const k of Object.keys(shapes)) delete shapes[k];
  m(useQuery).mockImplementation((opts: { queryKey: unknown[] }) => {
    const k0 = String(opts.queryKey[0]);
    // "intelligence" bucket keys further specialise by queryKey[1].
    if (k0 === "intelligence") return shapes[String(opts.queryKey[1])] ?? loading;
    return shapes[k0] ?? loading;
  });
});

describe("IntelligenceBriefWidget", () => {
  it("renders the collapsed widget in loading state without throwing", () => {
    expect(() => html()).not.toThrow();
  });

  it("renders with populated climate + alerts + overdue", () => {
    setKey("home-profile", { data: { home: { name: "Oak House" } } });
    setKey("home-climate", { data: { latest: { overall_climate_score: 78 } } });
    setKey("patterns", { data: [{ id: "p1", severity: "high", label: "Trend up" }] });
    setKey("action-outcomes", { data: [{ id: "a1", title: "Overdue action" }] });
    expect(() => html()).not.toThrow();
  });

  it("renders empty state (all queries return empty data) without throwing", () => {
    setKey("home-profile", { data: { home: null, provisioned: false } });
    setKey("home-climate", { data: null });
    setKey("patterns", { data: [] });
    setKey("action-outcomes", { data: [] });
    expect(() => html()).not.toThrow();
  });

  it("does not throw when only one query populated (class 6b guard)", () => {
    setKey("home-climate", { data: null });
    // three others left loading
    expect(() => html()).not.toThrow();
  });
});
