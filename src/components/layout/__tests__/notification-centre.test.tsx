import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children?: React.ReactNode; href?: string }) =>
    React.createElement("a", { href }, children),
}));

const stubMutation = () => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn().mockResolvedValue({}),
  isPending: false,
  isError: false,
  isSuccess: false,
  reset: vi.fn(),
});

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => stubMutation()),
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
  }),
}));

vi.mock("@/contexts/auth-context", () => ({
  useAuthContext: () => ({ currentUser: { id: "staff_darren", first_name: "Alex" } }),
}));

import { useQuery } from "@tanstack/react-query";
import { NotificationCentre } from "../notification-centre";

const m = (fn: unknown) => fn as unknown as Mock;
const html = () => renderToStaticMarkup(React.createElement(NotificationCentre));

// Four useQuery calls, each with its own key: "home-profile" (useHomeName),
// "intelligence" (usePatternAlerts), "notifications" (useNotifications), and
// "dashboard" (direct). The bell always renders; the dropdown is gated by
// local `open` state and stays collapsed in SSR. Any of the four returning a
// bad shape would still throw on the read path (e.g. dashboard.data?.data
// used in the notifications builder).
type Shape = { isLoading: boolean; data: unknown };
const loading: Shape = { isLoading: true, data: undefined };
const shapes: Record<string, Shape> = {};

function setKey(key: "home-profile" | "intelligence" | "notifications" | "dashboard", data: unknown) {
  shapes[key] = { isLoading: false, data };
}

beforeEach(() => {
  for (const k of Object.keys(shapes)) delete shapes[k];
  m(useQuery).mockImplementation((opts: { queryKey: unknown[] }) => {
    return shapes[String(opts.queryKey[0])] ?? loading;
  });
});

describe("NotificationCentre", () => {
  it("renders the bell in loading state without throwing", () => {
    expect(() => html()).not.toThrow();
    // Bell button is always rendered (title includes notification count).
    expect(html()).toContain("notification");
  });

  // A "populated" test is deliberately omitted: the notification builder
  // reads ~15 sub-branches of the dashboard shape (safeguarding, incidents,
  // medication.missed_today, care_plans.overdue, tasks, and more). Faking a
  // full DashboardData that satisfies every branch would drift with the
  // engine; the loading + empty + class-6b-guard tests cover the mock-bleed
  // risk. Add a populated test with a real fixture when the shape settles.

  it("renders empty state (all queries return empty) without throwing", () => {
    setKey("dashboard", { data: null });
    setKey("intelligence", { data: [] });
    setKey("notifications", { data: [] });
    setKey("home-profile", { data: { home: null, provisioned: false } });
    expect(() => html()).not.toThrow();
  });

  it("does not throw when only one query populated (class 6b guard — the rest loading)", () => {
    setKey("dashboard", { data: null });
    // other three left loading
    expect(() => html()).not.toThrow();
  });
});
