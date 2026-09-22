// ══════════════════════════════════════════════════════════════════════════════
// RESETTING A COLLEAGUE'S ACCESS
//
// The sign-in page promised this ("Managers can also reset a colleague's
// access from the staff record") long before it existed. It matters for a home
// with one administrator: the "forgotten password" email goes through
// Supabase's built-in dev mailer — 2 per hour, no delivery guarantee — so
// without this, a lost password meant the Supabase dashboard or nothing.
//
// THE CEILING IS THE POINT. Resetting a password is taking the account, and it
// locks the rightful holder out at the same time. A deputy manager must not be
// able to do it to the Registered Manager. These tests are mostly about that.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const guard = vi.hoisted(() => ({ impl: (() => ({ role: "registered_manager", userId: "m" })) as () => unknown }));
const state = vi.hoisted(() => ({
  enabled: true,
  staff: null as Record<string, unknown> | null,
  updateError: null as { message: string } | null,
  updated: [] as { id: string; password: string }[],
}));

vi.mock("@/lib/auth-guard", () => ({ requirePermissionAsync: async () => guard.impl() }));
vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => state.enabled,
  createServerClient: () => ({
    auth: {
      admin: {
        updateUserById: async (id: string, attrs: { password: string }) => {
          if (state.updateError) return { data: null, error: state.updateError };
          state.updated.push({ id, password: attrs.password });
          return { data: { user: { id } }, error: null };
        },
      },
    },
  }),
}));
vi.mock("@/lib/db", () => ({ dal: { staff: { findById: async () => state.staff } } }));

import { POST } from "../route";

const call = () =>
  POST(
    new NextRequest(new Request("http://t/api/v1/staff/s1/login/reset", { method: "POST" })),
    { params: Promise.resolve({ id: "s1" }) },
  );

const AS = (role: string) => () => ({ role, userId: "actor" });
const staffRow = (over: Record<string, unknown> = {}) => ({
  id: "s1", full_name: "SAIRA WAHID", role: "deputy_manager",
  email: "saira@example.com", auth_user_id: "auth_1", ...over,
});

beforeEach(() => {
  guard.impl = AS("registered_manager");
  state.enabled = true;
  state.staff = staffRow();
  state.updateError = null;
  state.updated = [];
});

describe("the ceiling", () => {
  it("THE POINT: a deputy manager cannot reset the registered manager", async () => {
    guard.impl = AS("deputy_manager");
    state.staff = staffRow({ role: "registered_manager", full_name: "Darren Laville" });
    const res = await call();
    expect(res.status).toBe(403);
    expect(state.updated).toHaveLength(0);
  });

  it("nor the super_admin", async () => {
    guard.impl = AS("deputy_manager");
    state.staff = staffRow({ role: "super_admin" });
    expect((await call()).status).toBe(403);
    expect(state.updated).toHaveLength(0);
  });

  it("a manager CAN reset their deputy", async () => {
    guard.impl = AS("registered_manager");
    state.staff = staffRow({ role: "deputy_manager" });
    expect((await call()).status).toBe(200);
    expect(state.updated).toHaveLength(1);
  });

  it("resetting at your own level is allowed", async () => {
    guard.impl = AS("registered_manager");
    state.staff = staffRow({ role: "registered_manager" });
    expect((await call()).status).toBe(200);
  });

  it("fails closed on a role it cannot rank", async () => {
    guard.impl = AS("registered_manager");
    state.staff = staffRow({ role: "wizard" });
    expect((await call()).status).toBe(403);
    expect(state.updated).toHaveLength(0);
  });

  it("refuses a caller without MANAGE_STAFF at all", async () => {
    guard.impl = () => NextResponse.json({ error: "Forbidden" }, { status: 403 });
    expect((await call()).status).toBe(403);
    expect(state.updated).toHaveLength(0);
  });
});

describe("the reset itself", () => {
  it("issues a new password and returns it once", async () => {
    const json = await (await call()).json();
    expect(typeof json.data.temporary_password).toBe("string");
    expect(json.data.temporary_password.length).toBeGreaterThan(16);
    expect(json.data.email).toBe("saira@example.com");
  });

  it("applies it to the right auth account", async () => {
    const json = await (await call()).json();
    expect(state.updated).toHaveLength(1);
    expect(state.updated[0].id).toBe("auth_1");
    expect(state.updated[0].password).toBe(json.data.temporary_password);
  });

  it("issues a different password each time", async () => {
    const a = await (await call()).json();
    const b = await (await call()).json();
    expect(a.data.temporary_password).not.toBe(b.data.temporary_password);
  });

  it("warns that the old password has stopped working", async () => {
    const json = await (await call()).json();
    expect(json.data.note).toMatch(/no longer works/i);
  });
});

describe("refusals", () => {
  it("404s for a staff member who does not exist", async () => {
    state.staff = null;
    expect((await call()).status).toBe(404);
  });

  it("refuses someone with no login — that is a create, not a reset", async () => {
    state.staff = staffRow({ auth_user_id: null });
    const res = await call();
    expect(res.status).toBe(409);
    expect((await res.json()).detail).toMatch(/create one instead/i);
    expect(state.updated).toHaveLength(0);
  });

  it("is unavailable in demo", async () => {
    state.enabled = false;
    expect((await call()).status).toBe(409);
  });

  it("surfaces a failure from the auth service rather than claiming success", async () => {
    state.updateError = { message: "network" };
    expect((await call()).status).toBe(400);
  });
});
