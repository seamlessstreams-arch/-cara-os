// ══════════════════════════════════════════════════════════════════════════════
// PUT /api/cara/reports/[id] — does the section belong to the report in the URL?
//
// The route read the report id from the path (renaming it `reportId` for use)
// and then updated purely by the body's `sectionId`. Nothing tied the two
// together, so ANY report id accepted ANY section: a manager editing report A
// could rewrite a section of report B — a different child's report — and both
// the URL and the response would look entirely ordinary.
//
// Two siblings already got this right, which is what makes it a bug rather than
// a design choice: `rewriteSection` in the very same file scopes with
// `.eq("id", sectionId).eq("report_id", reportId)`, and the regulatory
// reporting service loads its report by id before touching a section.
//
// The handler runs for real against a fake Supabase client that answers only
// when BOTH filters match.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from "vitest";

const createServerClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => createServerClient(),
  isSupabaseEnabled: () => true,
}));

import { PUT } from "@/app/api/cara/reports/[id]/route";
import { NextRequest } from "next/server";

const REPORT_A = "11111111-1111-4111-8111-111111111111";
const REPORT_B = "22222222-2222-4222-8222-222222222222";
const SECTION_OF_B = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

/** Honours .eq() the way PostgREST does: every filter must match. */
function ownershipAwareClient() {
  return {
    from: () => {
      const filters: Record<string, unknown> = {};
      const builder: Record<string, unknown> = {
        update: () => builder,
        select: () => builder,
        eq: (col: string, val: unknown) => {
          filters[col] = val;
          return builder;
        },
        single: () => {
          const matches =
            filters.id === SECTION_OF_B &&
            (filters.report_id === undefined || filters.report_id === REPORT_B);
          return Promise.resolve(
            matches
              ? { data: { id: SECTION_OF_B, report_id: REPORT_B, content: "new" }, error: null }
              : { data: null, error: { message: "No rows found" } },
          );
        },
      };
      return builder;
    },
  };
}

function putReq(body: unknown) {
  return new NextRequest(
    new Request("http://x/api/cara/reports/whatever", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("report section ownership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createServerClient.mockReturnValue(ownershipAwareClient());
  });

  it("refuses a section that belongs to a different report", async () => {
    const res = await PUT(
      putReq({
        action: "update_section",
        sectionId: SECTION_OF_B, // belongs to report B…
        content: "edited from the wrong report",
        updatedBy: "staff_darren",
      }),
      ctx(REPORT_A), // …but the URL names report A
    );

    expect(res.status).toBe(404);
    expect((await res.json()).ok).toBe(false);
  });

  it("updates a section that does belong to the report", async () => {
    const res = await PUT(
      putReq({
        action: "update_section",
        sectionId: SECTION_OF_B,
        content: "edited from its own report",
        updatedBy: "staff_darren",
      }),
      ctx(REPORT_B),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.report_id).toBe(REPORT_B);
  });
});
