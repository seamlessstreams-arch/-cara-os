import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// The live-tail audit viewer page calls this route. On a live tenant the
// in-memory store is emptied, so the route must read the durable
// cara_studio_audit_log instead. These tests prove the live/demo branch:
// live returns the service rows, demo returns the store rows. They fail
// against the previous route, which always read the store.

const h = vi.hoisted(() => ({ state: { live: true } }));

vi.mock("@/lib/supabase/server", () => ({ isSupabaseEnabled: () => h.state.live }));
vi.mock("@/lib/supabase/tenant", () => ({ tenantHomeId: () => "home-oak" }));
vi.mock("@/lib/cara/cara-studio-guard", () => ({
  requireCaraStudioPermission: async () => ({ ok: true }),
}));
vi.mock("@/lib/cara/cara-audit-trail", () => ({
  loadAuditTrail: () => [{ id: "store-row", actor_id: "store-actor" }],
  loadAuditActors: () => ["store-actor"],
}));
vi.mock("@/lib/cara-studio/audit.service", () => ({
  getHomeAuditTrail: async () => [{ id: "live-row", actor_id: "live-actor" }],
  getHomeAuditActors: async () => ["live-actor"],
}));

import { GET } from "@/app/api/v1/cara-studio/audit-trail/route";

const req = (qs = "") => new NextRequest(`http://x/api/v1/cara-studio/audit-trail${qs}`);

beforeEach(() => {
  h.state.live = true;
});

describe("GET /api/v1/cara-studio/audit-trail", () => {
  it("live: reads the durable audit log, not the emptied store", async () => {
    const body = await (await GET(req())).json();
    expect(body.data).toEqual([{ id: "live-row", actor_id: "live-actor" }]);
  });

  it("live: actors come from the durable audit log", async () => {
    const body = await (await GET(req("?actors=1"))).json();
    expect(body.data).toEqual(["live-actor"]);
  });

  it("demo: falls back to the in-memory store", async () => {
    h.state.live = false;
    const body = await (await GET(req())).json();
    expect(body.data).toEqual([{ id: "store-row", actor_id: "store-actor" }]);
  });

  it("demo: actors from the store", async () => {
    h.state.live = false;
    const body = await (await GET(req("?actors=1"))).json();
    expect(body.data).toEqual(["store-actor"]);
  });
});
