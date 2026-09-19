// ══════════════════════════════════════════════════════════════════════════════
// STAFF CREATE — a login is not something a request body can grant itself
//
// POST /api/v1/staff had NO check of any kind: no session, no role. Meanwhile
// `role` and `auth_user_id` were both in the column allowlist the handler wrote
// through. So any signed-in user could create a staff row with role
// "super_admin" bound to a second auth account they controlled, sign in on that
// account, and be an administrator. Middleware gates /api/v1/* behind a
// session, so this was never open to the internet — it was open to everyone
// holding a login, which from inside a children's home is the same thing.
//
// The sibling [id] PATCH route already required MANAGE_STAFF. Only create was
// missed, which is why nothing looked wrong.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const guard = vi.hoisted(() => ({
  impl: (() => ({ role: "registered_manager", userId: "staff_mgr" })) as () => unknown,
}));
vi.mock("@/lib/auth-guard", () => ({
  requirePermissionAsync: async () => guard.impl(),
}));

import { POST } from "../route";
import { getStore } from "@/lib/db/store";

const post = (body: unknown) =>
  POST(new NextRequest(new Request("http://t/api/v1/staff", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })));

const ALLOWED = () => ({ role: "registered_manager", userId: "staff_mgr" });
const DENIED = () => NextResponse.json({ error: "Forbidden" }, { status: 403 });

beforeEach(() => { guard.impl = ALLOWED; });

describe("POST /api/v1/staff is a MANAGE_STAFF action", () => {
  it("refuses a caller the guard rejects", async () => {
    guard.impl = DENIED;
    const res = await post({ full_name: "Mallory Malice", role: "super_admin" });
    expect(res.status).toBe(403);
  });

  it("creates nothing when refused", async () => {
    guard.impl = DENIED;
    const before = getStore().staff.length;
    await post({ full_name: "Mallory Malice", role: "super_admin" });
    expect(getStore().staff.length).toBe(before);
  });

  it("allows a manager to create a staff member", async () => {
    const res = await post({ full_name: "Nina New", first_name: "Nina", last_name: "New" });
    expect(res.status).toBe(201);
  });
});

describe("auth_user_id can never arrive from the request body", () => {
  it("is not written even when supplied", async () => {
    const res = await post({
      full_name: "Mallory Malice",
      first_name: "Mallory",
      last_name: "Malice",
      role: "super_admin",
      auth_user_id: "00000000-0000-0000-0000-00000000dead",
    });
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.data?.auth_user_id ?? null).not.toBe("00000000-0000-0000-0000-00000000dead");
  });

  it("is absent from the staff column allowlist the writer uses", async () => {
    // The real guarantee: the column list itself. A route-level strip can be
    // undone by the next person touching the handler; this cannot be set at all.
    const src = await import("node:fs").then((fs) =>
      fs.readFileSync("src/lib/supabase/queries.ts", "utf8"));
    const block = src.slice(src.indexOf("const STAFF_MEMBER_COLS"));
    const list = block.slice(0, block.indexOf("] as const;"));
    expect(list).not.toContain('"auth_user_id"');
  });
});
