import { describe, it, expect, vi, beforeEach } from "vitest";

// Unit tests for the home-wide audit readers that back the live-tail viewer.
// They drive getHomeAuditTrail / getHomeAuditActors against a fake supabase
// query builder and assert the query is scoped to the home, ordered
// newest-first, and capped — the guarantees the in-memory loadAuditTrail gave
// that the live path must preserve.

const h = vi.hoisted(() => ({ state: { client: null as unknown } }));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => h.state.client,
}));

import { getHomeAuditTrail, getHomeAuditActors } from "@/lib/cara-studio/audit.service";

interface Call {
  method: string;
  args: unknown[];
}

// A chainable, awaitable stand-in for the supabase query builder. Every method
// returns the builder and records its args; awaiting it resolves to { data }.
function fakeClient(rows: Record<string, unknown>[]): { client: unknown; calls: Call[] } {
  const calls: Call[] = [];
  const builder: Record<string, unknown> = {};
  for (const m of ["select", "eq", "order", "gte", "limit"]) {
    builder[m] = (...args: unknown[]) => {
      calls.push({ method: m, args });
      return builder;
    };
  }
  (builder as { then: unknown }).then = (
    res: (v: unknown) => unknown,
    rej: (e: unknown) => unknown,
  ) => Promise.resolve({ data: rows, error: null }).then(res, rej);
  const client = {
    from: (t: string) => {
      calls.push({ method: "from", args: [t] });
      return builder;
    },
  };
  return { client, calls };
}

const arg = (calls: Call[], method: string) => calls.find((c) => c.method === method)?.args;

beforeEach(() => {
  h.state.client = null;
});

describe("getHomeAuditTrail", () => {
  it("returns [] when Supabase is off", async () => {
    h.state.client = null;
    expect(await getHomeAuditTrail("home-1")).toEqual([]);
  });

  it("scopes to the home, orders newest-first, and caps the limit at 500", async () => {
    const rows = [{ id: "a", home_id: "home-1", actor_id: "u1" }];
    const { client, calls } = fakeClient(rows);
    h.state.client = client;

    const out = await getHomeAuditTrail("home-1", { limit: 9999 });

    expect(out).toEqual(rows);
    expect(calls).toContainEqual({ method: "from", args: ["cara_studio_audit_log"] });
    expect(calls).toContainEqual({ method: "eq", args: ["home_id", "home-1"] });
    expect(arg(calls, "order")).toEqual(["created_at", { ascending: false }]);
    expect(arg(calls, "limit")).toEqual([500]);
  });

  it("defaults the limit to 200 when unset", async () => {
    const { client, calls } = fakeClient([]);
    h.state.client = client;
    await getHomeAuditTrail("home-1");
    expect(arg(calls, "limit")).toEqual([200]);
  });

  it("applies actor, action, artifact and since filters", async () => {
    const { client, calls } = fakeClient([]);
    h.state.client = client;

    await getHomeAuditTrail("home-1", {
      actorId: "u9",
      actionType: "artifact_committed",
      artifactId: "art-3",
      sinceIso: "2026-11-01T00:00:00Z",
    });

    expect(calls).toContainEqual({ method: "eq", args: ["actor_id", "u9"] });
    expect(calls).toContainEqual({ method: "eq", args: ["action_type", "artifact_committed"] });
    expect(calls).toContainEqual({ method: "eq", args: ["artifact_id", "art-3"] });
    expect(calls).toContainEqual({ method: "gte", args: ["created_at", "2026-11-01T00:00:00Z"] });
  });

  it("does not add filters that were not requested", async () => {
    const { client, calls } = fakeClient([]);
    h.state.client = client;
    await getHomeAuditTrail("home-1");
    // only the home_id eq; no actor/action/artifact eq, no gte
    expect(calls.filter((c) => c.method === "eq")).toEqual([{ method: "eq", args: ["home_id", "home-1"] }]);
    expect(calls.some((c) => c.method === "gte")).toBe(false);
  });
});

describe("getHomeAuditActors", () => {
  it("returns sorted distinct actor ids, dropping nulls", async () => {
    const { client } = fakeClient([
      { actor_id: "zed" },
      { actor_id: "amy" },
      { actor_id: "zed" },
      { actor_id: null },
    ]);
    h.state.client = client;
    expect(await getHomeAuditActors("home-1")).toEqual(["amy", "zed"]);
  });

  it("returns [] when Supabase is off", async () => {
    h.state.client = null;
    expect(await getHomeAuditActors("home-1")).toEqual([]);
  });
});
