import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// The RI provider-oversight route stores its log in ri_oversight_notes on live.
// These tests drive the real handlers with a fake client + a signed-in session:
//   • POST writes the session's home and user and the chosen entry type;
//   • POST refuses an empty comment and an unknown entry type is normalised;
//   • GET returns the home's entries mapped to the page's log shape;
//   • demo mode keeps the in-memory log.

const SESSION_HOME = "f0000000-0000-4000-8000-000000000001";
const SESSION_USER = "a0000000-0000-4000-8000-0000000000aa";

const h = vi.hoisted(() => {
  const state = {
    live: true,
    identity: null as unknown,
    inserted: null as Record<string, unknown> | null,
    logRows: [] as Record<string, unknown>[],
    summaryRows: [] as Record<string, unknown>[],
    calls: [] as { table: string; op: string; args: unknown[] }[],
  };
  function client() {
    return {
      from(table: string) {
        const chain: Record<string, unknown> = {};
        const rec = (op: string) => (...args: unknown[]) => { state.calls.push({ table, op, args }); return chain; };
        for (const op of ["select", "eq", "order", "limit"]) chain[op] = rec(op);
        chain.insert = (row: Record<string, unknown>) => { state.inserted = row; state.calls.push({ table, op: "insert", args: [row] }); return chain; };
        chain.single = () => Promise.resolve({ data: { id: "new-1", ...(state.inserted ?? {}) }, error: null });
        chain.then = (resolve: (v: unknown) => unknown) =>
          Promise.resolve({ data: table === "ri_oversight_notes" ? state.logRows : state.summaryRows, error: null }).then(resolve);
        return chain;
      },
    };
  }
  return { state, client };
});

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => h.state.live,
  createServerClient: () => h.client(),
}));
vi.mock("@/lib/auth-guard", () => ({ getRequestIdentity: async () => h.state.identity }));
vi.mock("@/lib/intelligence/audit", () => ({ writeIntelligenceAudit: vi.fn(async () => undefined) }));
vi.mock("@/lib/db", () => ({ dal: { home: { get: async () => ({ id: SESSION_HOME, name: "Oak House" }) } } }));

import { GET, POST } from "@/app/api/intelligence/oversight/route";

const json = (method: string, body: unknown) =>
  new NextRequest(new Request("http://x/api/intelligence/oversight", { method, body: JSON.stringify(body), headers: { "content-type": "application/json" } }));

beforeEach(() => {
  h.state.live = true;
  h.state.identity = { userId: SESSION_USER, role: "responsible_individual", homeId: SESSION_HOME };
  h.state.inserted = null;
  h.state.logRows = [];
  h.state.summaryRows = [];
  h.state.calls = [];
});

describe("POST /api/intelligence/oversight — live", () => {
  it("writes the session home and user, the content and the entry type", async () => {
    const res = await POST(json("POST", { homeId: "oak-house", notes: "Supervision gap to address", entryType: "action_request" }));
    expect(res.status).toBe(200);
    expect(h.state.calls.find((c) => c.op === "insert")?.table).toBe("ri_oversight_notes");
    expect(h.state.inserted).toMatchObject({
      home_id: SESSION_HOME,
      author_id: SESSION_USER,
      entry_type: "action_request",
      content: "Supervision gap to address",
      status: "open",
    });
  });

  it("refuses an empty comment", async () => {
    const res = await POST(json("POST", { notes: "   ", entryType: "comment" }));
    expect(res.status).toBe(400);
    expect(h.state.inserted).toBeNull();
  });

  it("normalises an unknown entry type to comment", async () => {
    await POST(json("POST", { notes: "Note", entryType: "something_else" }));
    expect(h.state.inserted).toMatchObject({ entry_type: "comment" });
  });

  it("returns 401 without a session", async () => {
    h.state.identity = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const res = await POST(json("POST", { notes: "Note" }));
    expect(res.status).toBe(401);
  });
});

describe("GET /api/intelligence/oversight — live", () => {
  it("maps the home's entries into the page's log shape, scoped to the session home", async () => {
    h.state.logRows = [
      { id: "e1", entry_type: "review", content: "Visit completed", status: "closed", author_id: SESSION_USER, created_at: "2026-11-09T10:00:00Z" },
    ];
    const res = await GET(new NextRequest("http://x/api/intelligence/oversight?homeId=oak-house"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.oversightLog).toEqual([
      { id: "e1", date: "2026-11-09", home: "Oak House", type: "review", content: "Visit completed", author: SESSION_USER, status: "closed" },
    ]);
    // the log read is scoped to the session's home, never the slug
    const homeEqs = h.state.calls.filter((c) => c.op === "eq" && c.args[0] === "home_id").map((c) => c.args[1]);
    expect(homeEqs.length).toBeGreaterThan(0);
    expect(homeEqs.every((v) => v === SESSION_HOME)).toBe(true);
    expect(homeEqs).not.toContain("oak-house");
  });
});

describe("demo mode", () => {
  it("adds to and returns the in-memory log", async () => {
    h.state.live = false;
    h.state.identity = { userId: "u1", role: "responsible_individual", homeId: null };
    const before = await (await GET(new NextRequest("http://x/api/intelligence/oversight"))).json();
    const n = before.oversightLog.length;
    const add = await POST(json("POST", { homeId: "home_oak", notes: "Demo note", entryType: "comment" }));
    expect((await add.json()).entry.content).toBe("Demo note");
    const after = await (await GET(new NextRequest("http://x/api/intelligence/oversight"))).json();
    expect(after.oversightLog.length).toBe(n + 1);
  });
});
