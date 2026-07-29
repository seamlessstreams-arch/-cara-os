import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children?: React.ReactNode; href?: string }) =>
    React.createElement("a", { href }, children),
}));

vi.mock("@tanstack/react-query", () => ({ useQuery: vi.fn() }));

import { useQuery } from "@tanstack/react-query";
import { FamilyContactCard } from "../family-contact-card";

const m = (fn: unknown) => fn as unknown as Mock;
const html = () => renderToStaticMarkup(React.createElement(FamilyContactCard));

// Two useQuery calls (contact-arrangements + contact-logs) each with their own
// key — a blanket mockReturnValue would feed both panels the same shape and
// mask class-6b-style bleed. Dispatch on queryKey[0] so each is set
// independently and any unset one stays in loading.
type Shape = { isPending: boolean; data: unknown };
const loading: Shape = { isPending: true, data: undefined };
const shapes: Record<string, Shape> = {};

function setKey(key: "contact-arrangements" | "contact-logs", data: unknown) {
  shapes[key] = { isPending: false, data };
}

beforeEach(() => {
  for (const k of Object.keys(shapes)) delete shapes[k];
  m(useQuery).mockImplementation((opts: { queryKey: unknown[] }) => {
    return shapes[String(opts.queryKey[0])] ?? loading;
  });
});

describe("FamilyContactCard", () => {
  it("renders loading state without throwing", () => {
    expect(() => html()).not.toThrow();
    expect(html()).toContain("Family Contact");
  });

  it("renders with populated arrangements + logs", () => {
    setKey("contact-arrangements", { data: [
      { id: "a1", child_id: "yp_alex", family_member: "Mum", status: "active" },
      { id: "a2", child_id: "yp_jordan", family_member: "Dad", status: "suspended" },
    ] });
    setKey("contact-logs", { data: [], meta: { total: 5, concerns: 1, distress: 0 } });
    expect(() => html()).not.toThrow();
  });

  it("renders empty state (no arrangements, no logs)", () => {
    setKey("contact-arrangements", { data: [] });
    setKey("contact-logs", { data: [], meta: { total: 0, concerns: 0, distress: 0 } });
    expect(() => html()).not.toThrow();
  });

  it("does not throw when one panel populated and the other still loading (class 6b guard)", () => {
    setKey("contact-arrangements", { data: [{ id: "a1", child_id: "yp_alex", family_member: "Mum", status: "active" }] });
    // contact-logs left as loading
    expect(() => html()).not.toThrow();
    // and vice versa
    delete shapes["contact-arrangements"];
    setKey("contact-logs", { data: [], meta: { total: 0, concerns: 0, distress: 0 } });
    expect(() => html()).not.toThrow();
  });
});
