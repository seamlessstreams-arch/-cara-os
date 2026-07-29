import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children?: React.ReactNode; href?: string }) =>
    React.createElement("a", { href }, children),
}));

vi.mock("@tanstack/react-query", () => ({ useQuery: vi.fn() }));

import { useQuery } from "@tanstack/react-query";
import { DailyLogSummaryCard } from "../daily-log-summary-card";

const m = (fn: unknown) => fn as unknown as Mock;
const html = () => renderToStaticMarkup(React.createElement(DailyLogSummaryCard));

// Two useQuery calls with different keys — "daily-log" (log entries + type
// breakdown) and "young-people" (roster the coverage bar is computed over).
// Dispatch on queryKey[0] so a test can populate one and leave the other
// loading, and blanket mockReturnValue can't bleed one shape into the other.
type Shape = { isLoading: boolean; data: unknown };
const loading: Shape = { isLoading: true, data: undefined };
const shapes: Record<string, Shape> = {};

function setKey(key: "daily-log" | "young-people", data: unknown) {
  shapes[key] = { isLoading: false, data };
}

beforeEach(() => {
  for (const k of Object.keys(shapes)) delete shapes[k];
  m(useQuery).mockImplementation((opts: { queryKey: unknown[] }) => {
    return shapes[String(opts.queryKey[0])] ?? loading;
  });
});

describe("DailyLogSummaryCard", () => {
  it("renders loading state without throwing", () => {
    expect(() => html()).not.toThrow();
    expect(html()).toContain("Daily Records");
  });

  it("renders a populated home (children with entries)", () => {
    setKey("young-people", {
      data: [
        { id: "yp_alex", first_name: "Alex", preferred_name: null, last_name: "R", status: "current" },
        { id: "yp_jordan", first_name: "Jordan", preferred_name: null, last_name: "P", status: "current" },
      ],
      meta: {},
    });
    setKey("daily-log", {
      data: [
        { child_id: "yp_alex", entry_type: "general", mood_score: 7, is_significant: false },
        { child_id: "yp_jordan", entry_type: "behaviour", mood_score: 4, is_significant: true },
      ],
      meta: { total: 2, by_type: { general: 1, behaviour: 1 } },
    });
    expect(() => html()).not.toThrow();
    expect(html()).toContain("2/2");
  });

  it("renders empty state (children in home but no logs) without throwing", () => {
    setKey("young-people", {
      data: [{ id: "yp_alex", first_name: "Alex", preferred_name: null, last_name: "R", status: "current" }],
      meta: {},
    });
    setKey("daily-log", { data: [], meta: { total: 0, by_type: {} } });
    expect(() => html()).not.toThrow();
    // Not all recorded — should show the "no entries today" warning
    expect(html()).toContain("no entries today");
  });

  it("does not throw when only one query populated (class 6b guard)", () => {
    setKey("young-people", { data: [], meta: {} });
    // daily-log left loading
    expect(() => html()).not.toThrow();
    delete shapes["young-people"];
    setKey("daily-log", { data: [], meta: { total: 0, by_type: {} } });
    expect(() => html()).not.toThrow();
  });
});
