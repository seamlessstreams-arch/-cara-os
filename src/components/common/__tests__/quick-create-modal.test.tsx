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

vi.mock("@/hooks/use-permissions", () => ({
  usePermissions: () => ({ can: () => true, canAccess: () => true }),
}));

import { useQuery } from "@tanstack/react-query";
import { QuickCreateModal } from "../quick-create-modal";

const m = (fn: unknown) => fn as unknown as Mock;
const html = (props: Partial<{ open: boolean; onClose: () => void }> = {}) =>
  renderToStaticMarkup(
    React.createElement(QuickCreateModal, { open: false, onClose: () => {}, ...props }),
  );

// Two useQuery calls: ["staff", params] and ["young-people", status]. The
// modal is gated by `if (!open) return null` — the SSR of `open: false` is
// empty, but the hooks still fire on mount, so a bad mock shape would still
// throw at registration time.
type Shape = { isLoading: boolean; data: unknown };
const loading: Shape = { isLoading: true, data: undefined };
const shapes: Record<string, Shape> = {};

function setKey(key: "staff" | "young-people", data: unknown) {
  shapes[key] = { isLoading: false, data };
}

beforeEach(() => {
  for (const k of Object.keys(shapes)) delete shapes[k];
  m(useQuery).mockImplementation((opts: { queryKey: unknown[] }) => {
    return shapes[String(opts.queryKey[0])] ?? loading;
  });
});

describe("QuickCreateModal", () => {
  it("renders nothing when closed, without throwing", () => {
    expect(() => html({ open: false })).not.toThrow();
    expect(html({ open: false })).toBe("");
  });

  it("does not throw when opened with both queries loading", () => {
    expect(() => html({ open: true })).not.toThrow();
    // Some modal chrome renders when open.
    expect(html({ open: true })).toContain("Cancel");
  });

  it("does not throw when opened with populated staff + young-people", () => {
    setKey("staff", { data: [{ id: "st_1", full_name: "Sarah T", role: "senior" }], meta: {} });
    setKey("young-people", { data: [{ id: "yp_alex", first_name: "Alex", last_name: "R", status: "current" }], meta: {} });
    expect(() => html({ open: true })).not.toThrow();
  });

  it("does not throw when only one query populated (class 6b guard)", () => {
    setKey("staff", { data: [], meta: {} });
    // young-people left loading
    expect(() => html({ open: true })).not.toThrow();
    delete shapes["staff"];
    setKey("young-people", { data: [], meta: {} });
    expect(() => html({ open: true })).not.toThrow();
  });
});
