import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@tanstack/react-query", () => ({ useQuery: vi.fn() }));

vi.mock("@/hooks/use-permissions", () => ({
  usePermissions: () => ({ canAccess: () => true }),
}));

import { useQuery } from "@tanstack/react-query";
import { CommandPalette } from "../command-palette";

const m = (fn: unknown) => fn as unknown as Mock;
const html = () => renderToStaticMarkup(React.createElement(CommandPalette));

// Two useQuery calls: ["young-people", status] and ["staff", params]. The
// palette starts closed (`if (!open) return null`) so SSR renders nothing —
// but the hooks still fire on mount and their return shape has to be safe to
// destructure. Dispatch by queryKey[0] so each stays independent.
type Shape = { isLoading: boolean; data: unknown };
const loading: Shape = { isLoading: true, data: undefined };
const shapes: Record<string, Shape> = {};

function setKey(key: "young-people" | "staff", data: unknown) {
  shapes[key] = { isLoading: false, data };
}

beforeEach(() => {
  for (const k of Object.keys(shapes)) delete shapes[k];
  m(useQuery).mockImplementation((opts: { queryKey: unknown[] }) => {
    return shapes[String(opts.queryKey[0])] ?? loading;
  });
});

describe("CommandPalette", () => {
  it("renders nothing (palette closed by default) without throwing", () => {
    expect(() => html()).not.toThrow();
    // Palette starts with open=false → `if (!open) return null` → empty markup.
    expect(html()).toBe("");
  });

  it("does not throw when young-people + staff both load", () => {
    setKey("young-people", { data: [{ id: "yp_alex", first_name: "Alex", last_name: "R", status: "current" }] });
    setKey("staff", { data: [{ id: "st_1", full_name: "Sarah T", role: "senior" }] });
    expect(() => html()).not.toThrow();
  });

  it("does not throw when one query populated and the other still loading (class 6b guard)", () => {
    setKey("young-people", { data: [] });
    // staff left loading
    expect(() => html()).not.toThrow();
    delete shapes["young-people"];
    setKey("staff", { data: [] });
    expect(() => html()).not.toThrow();
  });
});
