import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// Dates relative to "now" so the route's 7-day / 14-day / yesterday / today
// windows resolve the same way whenever the test runs.
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const NOW = Date.now();
const THREE_DAYS_AGO = iso(NOW - 3 * 86400000);
const YESTERDAY = iso(NOW - 86400000);

// Canonical-table data (what the dual-mode dal returns on a live tenant). Before
// the fix the briefing read a parallel cs_* schema that nothing writes to, so it
// always produced zero signals regardless of this data.
const incidents = [
  { child_id: "c1", reference: "INC-001", requires_oversight: true, oversight_by: null, date: THREE_DAYS_AGO, status: "open" },
  { child_id: "c2", reference: "INC-002", requires_oversight: true, oversight_by: null, date: THREE_DAYS_AGO, status: "open" },
  { child_id: "c1", reference: "INC-003", requires_oversight: true, oversight_by: null, date: THREE_DAYS_AGO, status: "open" },
  { child_id: "c2", reference: "INC-004", requires_oversight: true, oversight_by: "staff1", date: THREE_DAYS_AGO, status: "closed" }, // has oversight → excluded
];
const missingEpisodes = [
  { child_id: "c1", date_missing: THREE_DAYS_AGO, date_returned: THREE_DAYS_AGO, return_interview_date: null }, // overdue
  { child_id: "c2", date_missing: THREE_DAYS_AGO, date_returned: THREE_DAYS_AGO, return_interview_date: THREE_DAYS_AGO }, // done → excluded
];
const keyWork: { child_id: string; date: string }[] = []; // none recorded → all current children overdue
const youngPeople = [
  { id: "c1", status: "current" },
  { id: "c2", status: "current" },
  { id: "c3", status: "ended" },
];
const dailyLog = [{ child_id: "c1", date: YESTERDAY }]; // only 1 of 2 current children logged yesterday

vi.mock("@/lib/db/dal", () => ({
  dal: {
    incidents: { findAll: () => Promise.resolve(incidents) },
    missingEpisodes: { findAll: () => Promise.resolve(missingEpisodes) },
    keyWorkingSessions: { findAll: () => Promise.resolve(keyWork) },
    youngPeople: { findAll: () => Promise.resolve(youngPeople) },
    dailyLog: { findAll: () => Promise.resolve(dailyLog) },
  },
}));

// Supabase is "on" and the only direct sb use left is the homes-name read.
const sbStub = {
  from: () => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { name: "Oak House" } }) }) }) }),
};
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => sbStub,
  isSupabaseEnabled: () => true,
}));

beforeEach(() => vi.clearAllMocks());

interface Signal { id: string; severity: string; title: string; sourceModule: string }

async function call(): Promise<{ ok: boolean; data: { signalCount: number; signals: Signal[]; homeName: string } }> {
  const { GET } = await import("../route");
  const res = await GET(new NextRequest("http://localhost/api/cara/today-briefing?homeId=home_oak"));
  return res.json();
}

describe("GET /api/cara/today-briefing (canonical signals)", () => {
  it("builds real signals from canonical dal tables (was 0 from the cs_* schema)", async () => {
    const { ok, data } = await call();
    expect(ok).toBe(true);
    const ids = data.signals.map((s) => s.id);

    // 3 incidents need oversight (the 4th has oversight_by → excluded) → HIGH
    const inc = data.signals.find((s) => s.sourceModule === "incidents" && s.id.startsWith("sig_incidents"));
    expect(inc?.severity).toBe("high");
    expect(inc?.title).toContain("3 incident");

    expect(ids).toContain("sig_return_interview"); // 1 returned w/o interview
    const kw = data.signals.find((s) => s.id === "sig_key_work_overdue");
    expect(kw?.title).toContain("2 young people"); // both current children, no recent key work
    expect(ids).toContain("sig_log_gap"); // 1 of 2 logged yesterday
    expect(ids).toContain("sig_no_incidents"); // none dated today → positive

    expect(data.signalCount).toBeGreaterThanOrEqual(5);
    expect(data.homeName).toBe("Oak House");
  });

  it("does not fabricate a safeguarding-concern signal (no canonical source)", async () => {
    const { data } = await call();
    expect(data.signals.find((s) => s.id === "sig_safeguarding_open")).toBeUndefined();
  });
});
