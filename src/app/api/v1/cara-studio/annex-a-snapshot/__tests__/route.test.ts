import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// The annex-a-snapshot page lists + builds snapshots through this route. On a
// live tenant the store is emptied, so the route must read/persist via the
// service. These tests prove the live/demo branch and that a live storage
// failure surfaces as 503 rather than an empty/again-fabricated snapshot.

const h = vi.hoisted(() => ({ state: { live: true, liveThrows: false } }));

vi.mock("@/lib/supabase/server", () => ({ isSupabaseEnabled: () => h.state.live }));
vi.mock("@/lib/supabase/tenant", () => ({ tenantHomeId: () => "home-oak" }));
vi.mock("@/lib/http/read-json", () => ({ readJsonBody: async () => ({ ok: true, data: {} }) }));
vi.mock("@/lib/cara/cara-studio-guard", () => ({
  requireCaraStudioPermission: async () => ({ ok: true, actor: { userId: "u1" } }),
}));
vi.mock("@/lib/cara/cara-annex-a-snapshot", () => ({
  loadAnnexASnapshots: () => [{ id: "store-snap", status: "draft" }],
  runAnnexASnapshot: () => ({ id: "store-built", status: "draft" }),
}));
vi.mock("@/lib/cara-studio/annex-a-snapshot.service", () => ({
  loadAnnexASnapshotsLive: async () => {
    if (h.state.liveThrows) throw new Error("boom");
    return [{ id: "live-snap", status: "draft" }];
  },
  runAnnexASnapshotLive: async () => {
    if (h.state.liveThrows) throw new Error("boom");
    return { id: "live-built", status: "draft" };
  },
}));

import { GET, POST } from "@/app/api/v1/cara-studio/annex-a-snapshot/route";

const req = (method: string) => new NextRequest("http://x/api/v1/cara-studio/annex-a-snapshot", { method });

beforeEach(() => {
  h.state.live = true;
  h.state.liveThrows = false;
});

describe("GET /api/v1/cara-studio/annex-a-snapshot", () => {
  it("live: lists persisted snapshots", async () => {
    const body = await (await GET(req("GET"))).json();
    expect(body.data).toEqual([{ id: "live-snap", status: "draft" }]);
  });

  it("live: a read failure is 503, not an empty list", async () => {
    h.state.liveThrows = true;
    const res = await GET(req("GET"));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.storage_unavailable).toBe(true);
    expect(body).not.toHaveProperty("data");
  });

  it("demo: lists from the in-memory store", async () => {
    h.state.live = false;
    const body = await (await GET(req("GET"))).json();
    expect(body.data).toEqual([{ id: "store-snap", status: "draft" }]);
  });
});

describe("POST /api/v1/cara-studio/annex-a-snapshot", () => {
  it("live: builds + persists (201)", async () => {
    const res = await POST(req("POST"));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data).toEqual({ id: "live-built", status: "draft" });
  });

  it("live: a build failure is 503", async () => {
    h.state.liveThrows = true;
    const res = await POST(req("POST"));
    expect(res.status).toBe(503);
  });

  it("demo: builds from the store (201)", async () => {
    h.state.live = false;
    const res = await POST(req("POST"));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data).toEqual({ id: "store-built", status: "draft" });
  });
});
