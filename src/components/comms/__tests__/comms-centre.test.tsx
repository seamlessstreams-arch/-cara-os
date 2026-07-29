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
  useAuthContext: () => ({ currentUser: { id: "staff_darren", role: "residential_care_worker" } }),
}));

import { useQuery } from "@tanstack/react-query";
import { CommsCentre } from "../comms-centre";

const m = (fn: unknown) => fn as unknown as Mock;
const html = () => renderToStaticMarkup(React.createElement(CommsCentre));

// Two useQuery calls: ["comms", "channels"] (list) and ["comms", "messages",
// channelId] (thread). Both must return arrays (component destructures with
// `data: [] = ...`). The channelId in the messages key depends on the
// currently-selected channel, so we dispatch on queryKey[0] (both start with
// "comms" but we further specialise by queryKey[1]).
type Shape = { isLoading: boolean; data: unknown };
const loading: Shape = { isLoading: true, data: [] };
const shapes: Record<string, Shape> = {};

function setKey(sub: "channels" | "messages", data: unknown) {
  shapes[sub] = { isLoading: false, data };
}

beforeEach(() => {
  for (const k of Object.keys(shapes)) delete shapes[k];
  m(useQuery).mockImplementation((opts: { queryKey: unknown[] }) => {
    const sub = String(opts.queryKey[1]);
    return shapes[sub] ?? loading;
  });
});

describe("CommsCentre", () => {
  it("renders in loading state without throwing", () => {
    expect(() => html()).not.toThrow();
  });

  it("renders with an empty channels list without throwing", () => {
    setKey("channels", []);
    setKey("messages", []);
    expect(() => html()).not.toThrow();
  });

  it("renders with populated channels + a thread", () => {
    setKey("channels", [
      { id: "ch_home", name: "Oak House team", channel_type: "team", access: "team_only", sensitivity: "internal", unread_count: 2, last_message_at: "2026-07-29T10:00:00Z", requires_acknowledgement_count: 0 },
    ]);
    setKey("messages", [
      { id: "m1", channel_id: "ch_home", body: "Morning", author_id: "st_1", author_name: "Sarah T", created_at: "2026-07-29T09:00:00Z", read_by_me: true, is_deleted: false, priority: "normal", requires_acknowledgement: false, acknowledged: false },
    ]);
    expect(() => html()).not.toThrow();
  });

  it("does not throw when only channels populated (class 6b guard — messages left loading)", () => {
    setKey("channels", [
      { id: "ch_home", name: "Oak House team", channel_type: "team", access: "team_only", sensitivity: "internal", unread_count: 0, last_message_at: null, requires_acknowledgement_count: 0 },
    ]);
    // messages left loading with empty data array
    expect(() => html()).not.toThrow();
  });
});
