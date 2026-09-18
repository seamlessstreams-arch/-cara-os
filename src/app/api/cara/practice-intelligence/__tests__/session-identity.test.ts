// ══════════════════════════════════════════════════════════════════════════════
// Practice-intelligence routes — identity comes from the session on live.
//
// These six routes used to read x-user-id / the body for who was acting and
// which home it was for. On a live tenant that is forgeable. Pins that, in
// activated mode: no session → 401 whatever the headers say; a session's role
// gates access; and the session's home overrides body.homeId.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const session = vi.hoisted(() => ({ current: null as null | { userId: string; role: string; homeId: string | null } }));
vi.mock("@/lib/supabase/auth", () => ({ resolveStaffSession: async () => session.current }));

import { POST as ladoPOST } from "@/app/api/cara/practice-intelligence/lado/route";
import { GET as dashboardGET } from "@/app/api/cara/practice-intelligence/dashboard/route";
import { db } from "@/lib/db/store";

const post = (body: unknown, headers: Record<string, string> = {}) =>
  ladoPOST(new NextRequest(new Request("http://t/api/cara/practice-intelligence/lado", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) })));

describe("practice-intelligence — activated mode", () => {
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

  it("lado: no session → 401, even with x-user-id set to a manager", async () => {
    const res = await post({ concern: "A staff member was seen shouting at a child.", homeId: "h1" }, { "x-user-id": "staff_darren" });
    expect(res.status).toBe(401);
  });

  it("lado: a support worker's session cannot run a LADO analysis (403), whatever the header says", async () => {
    session.current = { userId: "u-rsw", role: "residential_care_worker", homeId: "h1" };
    const res = await post({ concern: "A staff member was seen shouting at a child.", homeId: "h1" }, { "x-user-id": "staff_darren" });
    expect(res.status).toBe(403);
  });

  it("lado: a manager's session is accepted and the flag is stored against the SESSION's home, not the body's", async () => {
    session.current = { userId: "u-rm", role: "registered_manager", homeId: "h-session" };
    const before = db.caraPracticeFlags.findAll().length;
    const res = await post({ concern: "A staff member was seen shouting at a child and grabbed their arm.", homeId: "h-forged", childId: "c1" });
    expect(res.status).toBe(200);
    const flags = db.caraPracticeFlags.findAll();
    if (flags.length > before) {
      expect(flags.at(-1)!.home_id).toBe("h-session");
      expect(flags.some((f) => f.home_id === "h-forged")).toBe(false);
    }
  });

  it("dashboard: no session → 401", async () => {
    const res = await dashboardGET(new NextRequest(new Request("http://t/api/cara/practice-intelligence/dashboard?homeId=h1", { headers: { "x-user-id": "staff_darren" } })));
    expect(res.status).toBe(401);
  });
});
