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
import { ChildExperienceTab } from "../child-experience-tab";

const m = (fn: unknown) => fn as unknown as Mock;
const html = () =>
  renderToStaticMarkup(
    React.createElement(ChildExperienceTab, { childId: "yp_alex", childName: "Alex" }),
  );

// Six useQuery calls, all under the "intelligence" bucket, specialised by
// queryKey[1]: "child-experience", "patterns", "interventions", "practice-
// bank", "voice", "relational". Dispatch on queryKey[1] so each panel gets
// its own shape and blanket mockReturnValue can't feed one panel's data to
// another (which is exactly the class-6b bug the sibling manager-practice-
// oversight-card fix, 1b914a347, was chasing).
type Shape = { isLoading: boolean; data: unknown };
const loading: Shape = { isLoading: true, data: undefined };
const shapes: Record<string, Shape> = {};

type Bucket =
  | "child-experience"
  | "patterns"
  | "interventions"
  | "practice-bank"
  | "voice"
  | "relational";

function setKey(key: Bucket, data: unknown) {
  shapes[key] = { isLoading: false, data };
}

beforeEach(() => {
  for (const k of Object.keys(shapes)) delete shapes[k];
  m(useQuery).mockImplementation((opts: { queryKey: unknown[] }) => {
    // All six live under "intelligence"; the second segment picks the bucket.
    if (opts.queryKey[0] === "intelligence") {
      return shapes[String(opts.queryKey[1])] ?? loading;
    }
    return loading;
  });
});

describe("ChildExperienceTab", () => {
  it("renders in loading state without throwing", () => {
    expect(() => html()).not.toThrow();
  });

  it("renders empty state (every panel returns empty) without throwing", () => {
    setKey("child-experience", { data: null });
    setKey("patterns", { data: [] });
    setKey("interventions", { data: [] });
    setKey("practice-bank", { data: [] });
    setKey("voice", { data: [] });
    setKey("relational", { data: [] });
    expect(() => html()).not.toThrow();
  });

  it("does not throw when only one bucket populated (class 6b guard — five others loading)", () => {
    setKey("patterns", { data: [] });
    expect(() => html()).not.toThrow();
    // and switch: only voice
    for (const k of Object.keys(shapes)) delete shapes[k];
    setKey("voice", { data: [] });
    expect(() => html()).not.toThrow();
  });
});
