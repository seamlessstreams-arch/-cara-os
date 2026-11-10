import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import type { CareEvent } from "@/types/care-events";

// The Reg 45 evidence route assembles the evidence bank from the care-event
// spine on live. These tests drive the real GET handler with a fake
// careEventsDb and a signed-in session, and check that:
//   • the bank is built only from the session's home events (never ?homeId=);
//   • a read failure surfaces as 503, not empty data (fabricated-absence rule);
//   • demo mode still returns the seeded bank.

const SESSION_HOME = "f0000000-0000-4000-8000-000000000001";

const h = vi.hoisted(() => ({
  state: {
    live: true,
    identity: null as unknown,
    events: [] as CareEvent[],
    throwErr: null as unknown,
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => h.state.live,
  createServerClient: () => ({}),
}));
vi.mock("@/lib/auth-guard", () => ({
  getRequestIdentity: async () => h.state.identity,
}));
vi.mock("@/lib/db", () => ({
  careEventsDb: {
    careEvents: {
      findAll: async () => {
        if (h.state.throwErr) throw h.state.throwErr;
        return h.state.events;
      },
    },
  },
}));

import { GET } from "@/app/api/intelligence/reg45-evidence/route";

const ev = (home: string, category: string, title: string, date: string): CareEvent =>
  ({ id: Math.random().toString(36).slice(2), home_id: home, category, title, event_date: date, status: "verified" } as unknown as CareEvent);

beforeEach(() => {
  h.state.live = true;
  h.state.identity = { userId: "u1", role: "registered_manager", homeId: SESSION_HOME };
  h.state.events = [];
  h.state.throwErr = null;
});

describe("GET /api/intelligence/reg45-evidence — live", () => {
  it("builds the bank only from the session home's events, ignoring ?homeId=oak-house", async () => {
    h.state.events = [
      ev(SESSION_HOME, "key_work", "Key-work with Alex", "2026-11-02"),
      ev(SESSION_HOME, "key_work", "Key-work with Jordan", "2026-11-01"),
      ev(SESSION_HOME, "safeguarding", "Disclosure logged", "2026-11-03"),
      ev("other-home-9999", "health", "Someone else's record", "2026-11-04"),
    ];
    const res = await GET(new NextRequest("http://x/api/intelligence/reg45-evidence?homeId=oak-house"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.persisted).toBe(true);
    expect(body.evidence).toEqual([
      { category: "Key-Work Sessions", count: 2, examples: ["Key-work with Alex", "Key-work with Jordan"] },
      { category: "Safeguarding Records", count: 1, examples: ["Disclosure logged"] },
    ]);
    // the other home's event is not counted
    expect(JSON.stringify(body.evidence)).not.toContain("Someone else");
  });

  it("surfaces a read failure as 503, never as an empty bank", async () => {
    h.state.throwErr = { code: "42P01", message: "relation does not exist" };
    const res = await GET(new NextRequest("http://x/api/intelligence/reg45-evidence"));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body).not.toHaveProperty("evidence");
    expect(body.storage_unavailable).toBe(true);
  });

  it("returns 401 when there is no session", async () => {
    h.state.identity = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const res = await GET(new NextRequest("http://x/api/intelligence/reg45-evidence"));
    expect(res.status).toBe(401);
  });

  it("demo mode returns the seeded bank unchanged", async () => {
    h.state.live = false;
    h.state.identity = { userId: "u1", role: "registered_manager", homeId: null };
    const res = await GET(new NextRequest("http://x/api/intelligence/reg45-evidence"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.evidence)).toBe(true);
    expect(body.evidence.length).toBeGreaterThan(0);
    expect(body.evidence[0]).toHaveProperty("category");
  });
});
