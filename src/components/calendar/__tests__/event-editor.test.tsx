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

import { useQuery } from "@tanstack/react-query";
import { EventEditor } from "../event-editor";

const m = (fn: unknown) => fn as unknown as Mock;
const html = (open = false) =>
  renderToStaticMarkup(
    React.createElement(EventEditor, { open, onClose: () => {} }),
  );

// Two useQuery calls: ["young-people", status] and ["staff", params]. Editor
// is gated by `if (!open) return null` — closed SSR is empty, but the hooks
// still fire so shape mismatches would throw at registration.
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

describe("EventEditor", () => {
  it("renders nothing when closed, without throwing", () => {
    expect(() => html(false)).not.toThrow();
    expect(html(false)).toBe("");
  });

  it("renders the form when open with both queries loading", () => {
    expect(() => html(true)).not.toThrow();
  });

  it("renders when opened with populated young-people + staff", () => {
    setKey("young-people", { data: [{ id: "yp_alex", first_name: "Alex", last_name: "R", status: "current" }] });
    setKey("staff", { data: [{ id: "st_1", full_name: "Sarah T", role: "senior" }] });
    expect(() => html(true)).not.toThrow();
  });

  it("does not throw when only one query populated (class 6b guard)", () => {
    setKey("young-people", { data: [] });
    // staff left loading
    expect(() => html(true)).not.toThrow();
    delete shapes["young-people"];
    setKey("staff", { data: [] });
    expect(() => html(true)).not.toThrow();
  });
});
