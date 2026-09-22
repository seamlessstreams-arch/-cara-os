// ══════════════════════════════════════════════════════════════════════════════
// Cara Studio guard — activated mode resolves the SESSION, not the client.
//
// The sibling test pins that a forged actor_role / x-cara-actor-role is refused
// in activated mode. This one pins the other half, which used to be missing:
// a real session gets through, with the role and home the session says — so
// the 56 studio / care-events routes behind this guard work on a live tenant
// instead of answering 401 to everyone.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const session = vi.hoisted(() => ({ current: null as null | { userId: string; role: string; homeId: string | null } }));

vi.mock("@/lib/supabase/auth", () => ({
  resolveStaffSession: async () => session.current,
}));

import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";

const makeReq = (headers: Record<string, string> = {}) =>
  new NextRequest(new Request("http://test/x", { method: "POST", headers }));

describe("Cara Studio guard — activated mode uses the session", () => {
  const ORIG_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const ORIG_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://real-project.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "real-service-role-key-abcdef123456";
    session.current = null;
  });
  afterEach(() => {
    if (ORIG_URL === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = ORIG_URL;
    if (ORIG_KEY === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = ORIG_KEY;
  });

  it("no session → 401, even with a forged manager header", async () => {
    const r = await requireCaraStudioPermission(makeReq({ "x-cara-actor-role": "registered_manager" }), { actor_role: "registered_manager" }, { permission: "cara.commit_to_records", homeId: "h1", intent: "t" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(401);
  });

  it("a registered-manager session is accepted with the session's identity, not the header's", async () => {
    session.current = { userId: "staff-uuid-1", role: "registered_manager", homeId: "h1" };
    const r = await requireCaraStudioPermission(makeReq({ "x-cara-actor-id": "attacker", "x-cara-actor-role": "viewer" }), { actor_id: "attacker" }, { permission: "cara.commit_to_records", homeId: "h1", intent: "t" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.actor.userId).toBe("staff-uuid-1");
      expect(r.actor.role).toBe("registered_manager");
      expect(r.actor.homeId).toBe("h1");
    }
  });

  it("a support-worker session lacking the permission → 403, whatever the body claims", async () => {
    session.current = { userId: "staff-uuid-2", role: "residential_care_worker", homeId: "h1" };
    const r = await requireCaraStudioPermission(makeReq(), { actor_role: "registered_manager" }, { permission: "cara.commit_to_records", homeId: "h1", intent: "t" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(403);
  });

  it("a manager of another home cannot act on this home's records", async () => {
    session.current = { userId: "staff-uuid-3", role: "registered_manager", homeId: "h2" };
    const r = await requireCaraStudioPermission(makeReq(), null, { permission: "cara.generate_drafts", homeId: "h1", intent: "t" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(403);
  });
});
