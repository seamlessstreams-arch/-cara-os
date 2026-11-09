// POST /api/practice-patterns/intake with Supabase auth active (the live
// posture): identity comes from the validated session, never from the
// client-controlled X-User-Id header.

import { describe, it, expect, vi } from "vitest";

const isSupabaseEnabled = vi.fn(() => true);
const resolveStaffSession = vi.fn();

vi.mock("@/lib/supabase/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/supabase/server")>()),
  isSupabaseEnabled: () => isSupabaseEnabled(),
}));
vi.mock("@/lib/supabase/auth", () => ({
  resolveStaffSession: (req: unknown) => resolveStaffSession(req),
}));

import { NextRequest } from "next/server";
import { POST } from "./route";

function post(): NextRequest {
  return new NextRequest("http://localhost/api/practice-patterns/intake", {
    method: "POST",
    // A forged manager header must count for nothing when auth is live.
    headers: { "content-type": "application/json", "x-user-id": "staff_darren" },
    body: JSON.stringify({
      url: "https://practice-notes.example.org/posts/auth-check",
      author: "Sam Fieldwell",
      note: "A note long enough to pass the length rule, about evaluation in quality reviews.",
      publicly_available: true,
    }),
  });
}

describe("POST /api/practice-patterns/intake — live auth posture", () => {
  it("EVAL: refuses an anonymous request (no session) with 401", async () => {
    resolveStaffSession.mockResolvedValue(null);
    const res = await POST(post());
    expect(res.status).toBe(401);
  });

  it("refuses a signed-in care worker with 403, whatever the X-User-Id header says", async () => {
    resolveStaffSession.mockResolvedValue({ userId: "staff-live-1", role: "residential_care_worker", homeId: "home-1" });
    const res = await POST(post());
    expect(res.status).toBe(403);
  });
});
