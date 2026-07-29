import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children?: React.ReactNode; href?: string }) =>
    React.createElement("a", { href }, children),
}));

vi.mock("@tanstack/react-query", () => ({ useQuery: vi.fn() }));

vi.mock("@/contexts/auth-context", () => ({
  useAuthContext: () => ({ currentUser: { first_name: "Alex" } }),
}));

import { useQuery } from "@tanstack/react-query";
import { OffShiftPortal } from "../off-shift-portal";

const m = (fn: unknown) => fn as unknown as Mock;
const html = () => renderToStaticMarkup(React.createElement(OffShiftPortal));

// Two useQuery calls: ["access", "shift-status", true] (whose access shape
// drives which branch renders) and ["safe-staffing"] (the on-call footer).
// The queryKey-dispatch pattern lets a test set one and leave the other
// loading — a blanket mockReturnValue would feed both the same shape.
type Shape = { isLoading: boolean; data: unknown };
const loading: Shape = { isLoading: true, data: undefined };
const shapes: Record<string, Shape> = {};

function setKey(key: "access" | "safe-staffing", data: unknown) {
  shapes[key] = { isLoading: false, data };
}

beforeEach(() => {
  for (const k of Object.keys(shapes)) delete shapes[k];
  m(useQuery).mockImplementation((opts: { queryKey: unknown[] }) => {
    return shapes[String(opts.queryKey[0])] ?? loading;
  });
});

describe("OffShiftPortal", () => {
  it("renders the loader when shift access is still loading", () => {
    expect(() => html()).not.toThrow();
  });

  it("senior staff who keep access see the 'full access' card", () => {
    setKey("access", { keeps_off_shift_access: true, on_shift: false, resources: [] });
    setKey("safe-staffing", { on_call: null });
    const out = html();
    expect(out).toContain("You have full access");
  });

  it("on-shift staff see the 'on shift' confirmation", () => {
    setKey("access", { keeps_off_shift_access: false, on_shift: true, resources: [] });
    setKey("safe-staffing", { on_call: null });
    const out = html();
    // renderToStaticMarkup escapes apostrophes to &#x27; — match the escaped form.
    expect(out).toContain("You&#x27;re on shift");
  });

  it("off-shift general staff see the portal (clock-in prompt + restricted list)", () => {
    setKey("access", {
      keeps_off_shift_access: false,
      on_shift: false,
      resources: [
        { resourceType: "records", action: "read", allowed: false, label: "Child records" },
      ],
    });
    setKey("safe-staffing", { on_call: { name: "Pat T", contact_number: "0700 000 000" } });
    const out = html();
    expect(out).toContain("Clock in");
    expect(out).toContain("Restricted until you clock in");
    expect(out).toContain("On call:");
  });

  it("does not throw when safe-staffing loads before access (class 6b guard)", () => {
    setKey("safe-staffing", { on_call: null });
    // access left loading → the loader path
    expect(() => html()).not.toThrow();
  });
});
