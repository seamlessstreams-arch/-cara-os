// ══════════════════════════════════════════════════════════════════════════════
// GET /api/cara/voice-history — whose reflections does it actually return?
//
// Voice reflections are a staff member's own reflective journal. The demo
// fixtures in the route show the register: "I felt out of my depth", "felt
// shaky", "my progress with the Level 3 qualification". That is personal
// practice reflection, not a shared record.
//
// The route used to read `homeId` and `userId` from the QUERY STRING, filter
// the query by home alone, and ignore the user entirely — so any authenticated
// colleague saw everyone's journals, and any caller could name a different
// home. Both identities now come from the validated session.
//
// The handler runs for real against a fake Supabase client that records the
// filters it was asked for.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from "vitest";

const isSupabaseEnabled = vi.fn();
const createServerClient = vi.fn();
const resolveStaffSession = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => isSupabaseEnabled(),
  createServerClient: () => createServerClient(),
}));
vi.mock("@/lib/supabase/auth", () => ({
  resolveStaffSession: (req: unknown) => resolveStaffSession(req),
}));

import { GET } from "@/app/api/cara/voice-history/route";
import { NextRequest } from "next/server";

/** Records every `.eq(column, value)` the route applies, per table. */
function recordingClient(filters: Record<string, [string, unknown][]>) {
  return {
    from: (table: string) => {
      filters[table] ??= [];
      const builder: Record<string, unknown> = {
        select: () => builder,
        order: () => builder,
        eq: (col: string, val: unknown) => {
          filters[table].push([col, val]);
          return builder;
        },
        // cara_sessions is awaited after .limit(); cara_messages after .limit() too.
        limit: () =>
          Promise.resolve(
            table === "cara_sessions"
              ? {
                  data: [
                    {
                      id: "sess-1",
                      created_at: "2026-08-20T09:00:00.000Z",
                      status: "completed",
                      risk_level: "low",
                      task_type: "voice_reflection",
                      page_context: "reflection",
                    },
                  ],
                  error: null,
                }
              : {
                  data: [
                    { role: "user", content: "transcript", agent_used: null, risk_level: "low" },
                    { role: "assistant", content: "structured", agent_used: "voice_reflection_agent", risk_level: "low" },
                  ],
                  error: null,
                },
          ),
      };
      return builder;
    },
  };
}

function makeReq(query: string) {
  return new NextRequest(new Request(`http://x/api/cara/voice-history${query}`));
}

describe("voice-history scoping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSupabaseEnabled.mockReturnValue(true);
    resolveStaffSession.mockResolvedValue({
      userId: "staff-real-caller",
      role: "residential_care_worker",
      homeId: "home-of-the-caller",
    });
  });

  it("scopes to the caller's own reflections, not the whole home", async () => {
    const filters: Record<string, [string, unknown][]> = {};
    createServerClient.mockReturnValue(recordingClient(filters));

    const res = await GET(makeReq(""));
    expect(res.status).toBe(200);

    expect(filters["cara_sessions"]).toContainEqual(["user_id", "staff-real-caller"]);
    expect(filters["cara_sessions"]).toContainEqual(["home_id", "home-of-the-caller"]);
  });

  it("ignores a homeId and userId supplied in the query string", async () => {
    const filters: Record<string, [string, unknown][]> = {};
    createServerClient.mockReturnValue(recordingClient(filters));

    await GET(makeReq("?homeId=someone-elses-home&userId=a-colleague"));

    const values = filters["cara_sessions"].map(([, v]) => v);
    expect(values).not.toContain("someone-elses-home");
    expect(values).not.toContain("a-colleague");
    expect(filters["cara_sessions"]).toContainEqual(["user_id", "staff-real-caller"]);
    expect(filters["cara_sessions"]).toContainEqual(["home_id", "home-of-the-caller"]);
  });

  it("refuses the read when there is no valid session", async () => {
    resolveStaffSession.mockResolvedValue(null);
    createServerClient.mockReturnValue(recordingClient({}));

    const res = await GET(makeReq("?homeId=home-of-the-caller"));

    expect(res.status).toBe(401);
    // and it must not have fallen through to the demo fixtures
    expect((await res.json()).data).toBeUndefined();
  });
});
