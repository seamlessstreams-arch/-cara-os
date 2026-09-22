import { describe, it, expect, vi } from "vitest";

// A durable write that fails must surface. Older dal writers returned `.data`
// straight off a failed insert — null, with the error discarded — and several
// fell back to the in-memory store, which on a live tenant means the caller is
// told a record was saved into a place it cannot survive. For a key-work
// session that is a recorded piece of evidence which quietly is not there when
// the evidence pack is built.
//
// cs_key_work_sessions is deliberately NOT seeded here: the fake answers an
// unseeded relation exactly as live PostgREST answers a missing one.
vi.mock("@/lib/supabase/server", async () => {
  const { makeFakeSupabaseModule } = await import("@/lib/test-utils/fake-supabase");
  return makeFakeSupabaseModule({ some_other_table: [] });
});

import { dal } from "@/lib/db";

const session = {
  child_id: "yp-1", staff_id: "st-1", date: "2026-09-10", type: "one_to_one" as const,
  duration: 30, location: "kitchen", topics: [], child_voice: "", worker_observations: "",
  actions_agreed: [], mood_before: null, mood_after: null, follow_up: null,
  follow_up_date: null, follow_up_completed: null, linked_goals: [],
  confidential: null, home_id: "", created_at: "",
};

describe("dal.keyWorkingSessions — a failed durable write never pretend-saves", () => {
  it("throws on create rather than returning a session that was not stored", async () => {
    await expect(dal.keyWorkingSessions.create(session as never)).rejects.toBeTruthy();
  });

  it("throws on update rather than reporting a patch that did not land", async () => {
    await expect(dal.keyWorkingSessions.update("kw-1", { location: "garden" } as never))
      .rejects.toBeTruthy();
  });
});
