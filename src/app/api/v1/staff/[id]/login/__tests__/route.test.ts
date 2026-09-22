// ══════════════════════════════════════════════════════════════════════════════
// STAFF LOGIN PROVISIONING
//
// Before this endpoint there was no way to give a staff member a login: nothing
// in the codebase wrote staff_members.auth_user_id, so it was a hand-run SQL
// statement or nothing. These pin the behaviour that matters — who may call it,
// that it refuses to strand an account, and that a failure to link never leaves
// an auth user pointing at nobody.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const guard = vi.hoisted(() => ({ impl: (() => ({ role: "registered_manager", userId: "m" })) as () => unknown }));
const state = vi.hoisted(() => ({
  enabled: true,
  staff: { id: "s1", email: null as string | null, auth_user_id: null as string | null },
  createError: null as { message: string } | null,
  linkThrows: false,
  created: [] as string[],
  deleted: [] as string[],
  linked: [] as { staffId: string; authUserId: string; email: string }[],
}));

vi.mock("@/lib/auth-guard", () => ({ requirePermissionAsync: async () => guard.impl() }));
vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => state.enabled,
  createServerClient: () => ({
    auth: {
      admin: {
        createUser: async () => {
          if (state.createError) return { data: null, error: state.createError };
          const id = `auth_${state.created.length + 1}`;
          state.created.push(id);
          return { data: { user: { id } }, error: null };
        },
        deleteUser: async (id: string) => { state.deleted.push(id); return { error: null }; },
      },
    },
  }),
}));
vi.mock("@/lib/supabase/queries", () => ({
  linkStaffAuthUser: async (_sb: unknown, staffId: string, authUserId: string, email: string) => {
    if (state.linkThrows) throw new Error("update failed");
    state.linked.push({ staffId, authUserId, email });
    return {};
  },
}));
vi.mock("@/lib/db", () => ({ dal: { staff: { findById: async () => state.staff } } }));

import { POST } from "../route";

const call = (body: unknown) =>
  POST(
    new NextRequest(new Request("http://t/api/v1/staff/s1/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })),
    { params: Promise.resolve({ id: "s1" }) },
  );

beforeEach(() => {
  guard.impl = () => ({ role: "registered_manager", userId: "m" });
  state.enabled = true;
  state.staff = { id: "s1", email: null, auth_user_id: null };
  state.createError = null;
  state.linkThrows = false;
  state.created = []; state.deleted = []; state.linked = [];
});

describe("who may create a login", () => {
  it("refuses a caller without MANAGE_STAFF", async () => {
    guard.impl = () => NextResponse.json({ error: "Forbidden" }, { status: 403 });
    expect((await call({ email: "a@b.com" })).status).toBe(403);
  });

  it("creates no auth user when refused", async () => {
    guard.impl = () => NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await call({ email: "a@b.com" });
    expect(state.created).toHaveLength(0);
  });
});

describe("creating the login", () => {
  it("returns the address and a one-time password, and links the record", async () => {
    const res = await call({ email: "Saira@Example.com" });
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.data.email).toBe("saira@example.com"); // normalised
    expect(typeof json.data.temporary_password).toBe("string");
    expect(json.data.temporary_password.length).toBeGreaterThan(16);
    expect(state.linked).toEqual([{ staffId: "s1", authUserId: "auth_1", email: "saira@example.com" }]);
  });

  it("falls back to the email already on the staff record", async () => {
    state.staff.email = "diane@example.com";
    const json = await (await call({})).json();
    expect(json.data.email).toBe("diane@example.com");
  });

  it("issues a different password each time", async () => {
    const a = await (await call({ email: "a@b.com" })).json();
    state.staff.auth_user_id = null;
    const b = await (await call({ email: "c@d.com" })).json();
    expect(a.data.temporary_password).not.toBe(b.data.temporary_password);
  });
});

describe("refusals that protect the record", () => {
  it("will not issue a second login for someone who has one", async () => {
    state.staff.auth_user_id = "auth_existing";
    const res = await call({ email: "a@b.com" });
    expect(res.status).toBe(409);
    expect(state.created).toHaveLength(0);
  });

  it("rejects a missing or malformed address", async () => {
    expect((await call({})).status).toBe(400);
    expect((await call({ email: "not-an-email" })).status).toBe(400);
    expect(state.created).toHaveLength(0);
  });

  it("is unavailable in demo, where the password would sign in nowhere", async () => {
    state.enabled = false;
    expect((await call({ email: "a@b.com" })).status).toBe(409);
  });

  it("surfaces an address already in use rather than pretending", async () => {
    state.createError = { message: "User already registered" };
    const res = await call({ email: "a@b.com" });
    expect(res.status).toBe(400);
    expect(state.linked).toHaveLength(0);
  });
});

describe("no stranded auth users", () => {
  it("rolls the auth user back when the link fails", async () => {
    state.linkThrows = true;
    const res = await call({ email: "a@b.com" });
    expect(res.status).toBe(500);
    // An auth user with nothing pointing at it can sign in and resolve to no
    // staff record — the exact limbo the endpoint exists to prevent.
    expect(state.deleted).toEqual(["auth_1"]);
  });
});
