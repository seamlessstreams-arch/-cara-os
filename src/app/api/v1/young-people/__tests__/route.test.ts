import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// Minimal source rows. c1 is a current child with linked activity across every
// source; c2 is a current child with nothing linked (the case that produced
// "Open Incidents: NaN" and "Age —" before enrichment); c3 is an ended
// placement (the UI's "former").
const youngPeople = [
  { id: "c1", status: "current", date_of_birth: "2010-05-14", key_worker_id: "s1", secondary_worker_id: null, risk_flags: ["CSE"] },
  { id: "c2", status: "current", date_of_birth: "2012-01-01", key_worker_id: null, secondary_worker_id: null, risk_flags: [] },
  { id: "c3", status: "ended", date_of_birth: "2009-03-03", key_worker_id: null, secondary_worker_id: null, risk_flags: ["SH"] },
];
const staff = [{ id: "s1", full_name: "Key Worker One" }];
const incidents = [
  { child_id: "c1", status: "open" },
  { child_id: "c1", status: "closed" },
];
const tasks = [
  { linked_child_id: "c1", status: "pending" },
  { linked_child_id: "c1", status: "completed" },
];
const medications = [
  { child_id: "c1", is_active: true },
  { child_id: "c1", is_active: false },
];
const missingEpisodes = [{ child_id: "c1" }];
const dailyLog = [
  { child_id: "c1", date: "2026-11-01" },
  { child_id: "c1", date: "2026-11-05" },
];

vi.mock("@/lib/db/dal", () => ({
  dal: {
    youngPeople: { findAll: () => Promise.resolve(youngPeople) },
    staff: { findAll: () => Promise.resolve(staff) },
    incidents: { findAll: () => Promise.resolve(incidents) },
    tasks: { findAll: () => Promise.resolve(tasks) },
    medications: { findAll: () => Promise.resolve(medications) },
    missingEpisodes: { findAll: () => Promise.resolve(missingEpisodes) },
    dailyLog: { findAll: () => Promise.resolve(dailyLog) },
  },
}));

beforeEach(() => vi.clearAllMocks());

interface EnrichedRow {
  id: string;
  age: number | null;
  open_incidents: number;
  active_tasks: number;
  active_medications: number;
  missing_episodes_total: number;
  last_log_date: string | null;
  key_worker: { id: string; full_name: string } | null;
}

async function call(status?: string): Promise<{ data: EnrichedRow[]; meta: Record<string, number> }> {
  const { GET } = await import("../route");
  const url = status
    ? `http://localhost/api/v1/young-people?status=${status}`
    : "http://localhost/api/v1/young-people";
  const res = await GET(new NextRequest(url));
  return res.json();
}

describe("GET /api/v1/young-people (enriched list)", () => {
  it("computes an accurate current/former/high-risk meta breakdown", async () => {
    const { meta } = await call("current");
    expect(meta).toEqual({ total: 3, current: 2, former: 1, high_risk: 1 });
  });

  it("enriches each child with real counts — never NaN or undefined", async () => {
    const { data } = await call("current");
    const c1 = data.find((d) => d.id === "c1");
    expect(c1).toBeDefined();
    expect(c1!.open_incidents).toBe(1); // 1 open, 1 closed
    expect(c1!.active_tasks).toBe(1); // 1 pending (completed excluded)
    expect(c1!.active_medications).toBe(1); // 1 active, 1 inactive
    expect(c1!.missing_episodes_total).toBe(1);
    expect(c1!.last_log_date).toBe("2026-11-05"); // latest of the two
    expect(c1!.key_worker).toEqual({ id: "s1", full_name: "Key Worker One" });
    expect(Number.isFinite(c1!.age)).toBe(true);

    // The regression: a child with nothing linked must read 0, not NaN/blank.
    const c2 = data.find((d) => d.id === "c2");
    expect(c2!.open_incidents).toBe(0);
    expect(c2!.active_medications).toBe(0);
    expect(c2!.key_worker).toBeNull();
    expect(c2!.last_log_date).toBeNull();
    expect(Number.isFinite(c2!.age)).toBe(true);
  });

  it("honours ?status= — current, former→ended, and all", async () => {
    expect((await call("current")).data.map((d) => d.id)).toEqual(["c1", "c2"]);
    expect((await call("former")).data.map((d) => d.id)).toEqual(["c3"]);
    expect((await call("all")).data.map((d) => d.id).sort()).toEqual(["c1", "c2", "c3"]);
    // No param preserves the catch-all's old behaviour: the full set.
    expect((await call()).data.length).toBe(3);
  });
});
