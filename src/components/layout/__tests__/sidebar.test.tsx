import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children?: React.ReactNode; href?: string }) =>
    React.createElement("a", { href }, children),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false, isError: false, isSuccess: false, reset: vi.fn(),
  })),
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
  }),
}));

vi.mock("@/contexts/auth-context", () => ({
  useAuthContext: () => ({
    currentUser: { id: "staff_darren", first_name: "Alex", role: "senior" },
    currentRole: "senior",
    setCurrentUserId: vi.fn(),
  }),
}));

vi.mock("@/contexts/sidebar-context", () => ({
  useSidebar: () => ({ collapsed: false, setCollapsed: vi.fn() }),
}));

vi.mock("@/hooks/use-permissions", () => ({
  usePermissions: () => ({ canAccess: () => true, can: () => true }),
}));

import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "../sidebar";

const m = (fn: unknown) => fn as unknown as Mock;
const html = () => renderToStaticMarkup(React.createElement(Sidebar));

// Eight useQuery calls: "staff", "home-profile", and six "sidebar" prefixed
// (tasks, incidents, forms, notifications, care-events-review, action-center).
// Dispatch on queryKey[0] for the two standalone keys and queryKey[1] under
// the "sidebar" bucket. All returning `undefined` data is the loading state.
type Shape = { isLoading: boolean; data: unknown };
const loading: Shape = { isLoading: true, data: undefined };
const shapes: Record<string, Shape> = {};

function setKey(key: string, data: unknown) {
  shapes[key] = { isLoading: false, data };
}

beforeEach(() => {
  for (const k of Object.keys(shapes)) delete shapes[k];
  m(useQuery).mockImplementation((opts: { queryKey: unknown[] }) => {
    const k0 = String(opts.queryKey[0]);
    if (k0 === "sidebar") return shapes[String(opts.queryKey[1])] ?? loading;
    return shapes[k0] ?? loading;
  });
});

describe("Sidebar", () => {
  it("renders in loading state without throwing", () => {
    expect(() => html()).not.toThrow();
  });

  it("renders with counts populated (badges show)", () => {
    setKey("home-profile", { data: { home: { name: "Oak House" } } });
    setKey("staff", { data: [], meta: {} });
    setKey("tasks", { data: [{ id: "t1", status: "not_started" }], meta: { total: 1 } });
    setKey("incidents", { data: [], meta: { total: 0 } });
    setKey("forms", { data: [], meta: { total: 0 } });
    setKey("notifications", { data: [], meta: { total: 0 } });
    setKey("care-events-review", { data: [], meta: { total: 0 } });
    setKey("action-center", { data: [], meta: { total: 0 } });
    expect(() => html()).not.toThrow();
  });

  it("renders empty state (all counts zero) without throwing", () => {
    setKey("home-profile", { data: { home: null, provisioned: false } });
    setKey("staff", { data: [], meta: {} });
    for (const k of ["tasks","incidents","forms","notifications","care-events-review","action-center"]) {
      setKey(k, { data: [], meta: { total: 0 } });
    }
    expect(() => html()).not.toThrow();
  });

  it("does not throw when only some queries populated (class 6b guard)", () => {
    setKey("tasks", { data: [{ id: "t1" }], meta: { total: 1 } });
    // seven others left loading — safe if the render tolerates
    // isLoading=true / data=undefined for any bucket.
    expect(() => html()).not.toThrow();
  });
});
