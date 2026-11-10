import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// On the live tenant the intelligence routes must act for the SESSION's home
// and the SESSION's user. The pages send the demo slug "oak-house" (and
// sometimes an actor or approver label such as "RI"); the live tables key
// home_id / created_by / approved_by as uuid, so trusting the request made
// every such read and write fail with 22P02 — no Linked Record ever saved.
//
// These tests drive the real route handlers with Supabase "enabled", a fake
// query builder that records every call, and a signed-in identity.

const SESSION_HOME = "f0000000-0000-4000-8000-000000000001";
const SESSION_USER = "a0000000-0000-4000-8000-0000000000aa";

const h = vi.hoisted(() => {
  type Call = { table: string; op: string; args: unknown[] };
  const state = {
    live: true,
    identity: null as unknown,
    calls: [] as Call[],
    existing: null as unknown,
    single: { id: "row-1" } as unknown,
  };
  function client() {
    return {
      from(table: string) {
        const chain: Record<string, unknown> = {};
        const rec = (op: string) => (...args: unknown[]) => {
          state.calls.push({ table, op, args });
          return chain;
        };
        for (const op of ["select", "eq", "order", "limit", "insert", "update", "upsert", "gte", "lte", "in", "neq", "is", "or"]) {
          chain[op] = rec(op);
        }
        chain.maybeSingle = () => {
          state.calls.push({ table, op: "maybeSingle", args: [] });
          return Promise.resolve({ data: state.existing, error: null });
        };
        chain.single = () => {
          state.calls.push({ table, op: "single", args: [] });
          return Promise.resolve({ data: state.single, error: null });
        };
        chain.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
          Promise.resolve({ data: [], error: null }).then(resolve, reject);
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
vi.mock("@/lib/auth-guard", () => ({
  getRequestIdentity: async () => h.state.identity,
}));
vi.mock("@/lib/intelligence/audit", () => ({
  writeIntelligenceAudit: vi.fn(async () => undefined),
}));

import { intelligenceScope } from "@/lib/intelligence/request-scope";
import { toDisplayLink } from "@/lib/intelligence/smart-link-display";
import * as attentionItems from "@/app/api/intelligence/attention-items/route";
import * as competence from "@/app/api/intelligence/competence/route";
import * as evidence from "@/app/api/intelligence/evidence/route";
import * as learningReview from "@/app/api/intelligence/learning-review/route";
import * as oversight from "@/app/api/intelligence/oversight/route";
import * as progress from "@/app/api/intelligence/progress/route";
import * as reg45 from "@/app/api/intelligence/reg45/route";
import * as reg45Evidence from "@/app/api/intelligence/reg45-evidence/route";
import * as smartLinks from "@/app/api/intelligence/smart-links/route";
import * as voice from "@/app/api/intelligence/voice/route";

const req = (url: string, init?: RequestInit) => new NextRequest(new Request(url, init));
const json = (url: string, method: string, body: unknown) =>
  req(url, { method, body: JSON.stringify(body), headers: { "content-type": "application/json" } });
const homeFilters = () =>
  h.state.calls.filter((c) => c.op === "eq" && c.args[0] === "home_id").map((c) => c.args[1]);

beforeEach(() => {
  h.state.live = true;
  h.state.identity = { userId: SESSION_USER, role: "registered_manager", homeId: SESSION_HOME };
  h.state.calls = [];
  h.state.existing = null;
  h.state.single = { id: "row-1" };
});

describe("intelligenceScope", () => {
  it("live: takes the home and actor from the session and ignores the request", async () => {
    const scope = await intelligenceScope(req("http://x/"), { homeId: "oak-house", actorUserId: "spoofed", actorRole: "ri" });
    expect(scope).toEqual({ homeId: SESSION_HOME, actorUserId: SESSION_USER, actorRole: "registered_manager", live: true });
  });

  it("live: passes the 401 through when there is no session", async () => {
    h.state.identity = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const scope = await intelligenceScope(req("http://x/"));
    expect(scope).toBeInstanceOf(NextResponse);
    expect((scope as NextResponse).status).toBe(401);
  });

  it("live: refuses with 403 when the staff record has no home", async () => {
    h.state.identity = { userId: SESSION_USER, role: "registered_manager", homeId: null };
    const scope = await intelligenceScope(req("http://x/"), { homeId: "oak-house" });
    expect((scope as NextResponse).status).toBe(403);
  });

  it("demo: keeps the request's own values, exactly as before", async () => {
    h.state.live = false;
    expect(await intelligenceScope(req("http://x/"), { homeId: "oak-house", actorUserId: "staff_1", actorRole: "rm" }))
      .toEqual({ homeId: "oak-house", actorUserId: "staff_1", actorRole: "rm", live: false });
    expect(await intelligenceScope(req("http://x/"), { homeId: "", actorUserId: 7 }))
      .toEqual({ homeId: null, actorUserId: null, actorRole: null, live: false });
  });
});

describe("live reads use the session's home, never ?homeId=oak-house", () => {
  const routes: Array<[string, (r: NextRequest) => Promise<Response>]> = [
    ["attention-items", attentionItems.GET],
    ["competence", competence.GET],
    ["evidence", evidence.GET],
    ["learning-review", learningReview.GET],
    ["oversight", oversight.GET],
    ["progress", progress.GET],
    ["reg45", reg45.GET],
    ["reg45-evidence", reg45Evidence.GET],
    ["smart-links", smartLinks.GET],
    ["voice", voice.GET],
  ];

  it.each(routes)("%s", async (name, GET) => {
    const res = await GET(req(`http://x/api/intelligence/${name}?homeId=oak-house&sourceId=s1`));
    expect(res.status).toBe(200);
    const homes = homeFilters();
    expect(homes.length).toBeGreaterThan(0); // the read IS home-scoped
    expect(homes.every((v) => v === SESSION_HOME)).toBe(true);
    expect(homes).not.toContain("oak-house");
  });

  it("oversight orders by period_end and no longer filters on a provider_id column live lacks", async () => {
    await oversight.GET(req("http://x/api/intelligence/oversight?providerId=p1"));
    const orders = h.state.calls.filter((c) => c.op === "order").map((c) => c.args[0]);
    expect(orders).toEqual(["period_end"]);
    expect(h.state.calls.some((c) => c.op === "eq" && c.args[0] === "provider_id")).toBe(false);
  });
});

describe("Linked records — save on live", () => {
  const link = {
    homeId: "oak-house",
    actorUserId: "spoofed-user",
    sourceType: "young_person",
    sourceId: "child-1",
    targetType: "risk_assessment",
    targetId: "auto-risk_assessment",
    relationship: "may_require_update",
    suggestedBy: "system",
  };

  it("writes the session's home and user, whatever the body says", async () => {
    const res = await smartLinks.POST(json("http://x/api/intelligence/smart-links", "POST", link));
    expect(res.status).toBe(200);
    const insert = h.state.calls.find((c) => c.op === "insert");
    expect(insert?.args[0]).toMatchObject({ home_id: SESSION_HOME, created_by: SESSION_USER, source_id: "child-1" });
  });

  it("creates a link at most once — an existing identical link is returned, not duplicated", async () => {
    h.state.existing = { id: "link-1", ...link };
    const res = await smartLinks.POST(json("http://x/api/intelligence/smart-links", "POST", link));
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, existing: true, link: { id: "link-1" } });
    expect(h.state.calls.some((c) => c.op === "insert")).toBe(false);
    // and the duplicate check itself was scoped to the session's home
    expect(homeFilters()).toEqual([SESSION_HOME]);
  });
});

describe("Reg 45 approval on live", () => {
  it("records the signed-in user as approver (not the page's 'RI' label) and scopes the update to the home", async () => {
    await reg45.PATCH(json("http://x/api/intelligence/reg45", "PATCH", { id: "r1", homeId: "oak-house", status: "approved", approvedBy: "RI" }));
    const update = h.state.calls.find((c) => c.op === "update");
    expect(update?.args[0]).toMatchObject({ approved_by: SESSION_USER });
    expect(homeFilters()).toEqual([SESSION_HOME]);
  });
});

describe("toDisplayLink", () => {
  it("reads the stored snake_case row, so an existing link matches its suggestion", () => {
    expect(
      toDisplayLink({ id: "l1", source_type: "incident", target_type: "child_profile", relationship: "involves_child", created_at: "2026-11-10T09:00:00Z", suggested_by: "system" }),
    ).toEqual({ id: "l1", sourceType: "incident", targetType: "child_profile", relationship: "involves_child", createdAt: "2026-11-10T09:00:00Z", suggestedBy: "system" });
  });
});
