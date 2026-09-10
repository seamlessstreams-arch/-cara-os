import { describe, it, expect, vi } from "vitest";

// The keywork consolidation's projection proof: cs_key_work_sessions rows
// (what key-working-service captures) come back through dal.keyWorkingSessions
// as honest KeyWorkingSession objects — vocabulary mapped, moods equal to the
// single recorded child_mood (never a fabricated improvement), unrecordable
// fields null rather than credited.
vi.mock("@/lib/supabase/server", async () => {
  const { makeFakeSupabaseModule } = await import("@/lib/test-utils/fake-supabase");
  return makeFakeSupabaseModule({
    cs_key_work_sessions: [
      {
        id: "kw-1", home_id: "33333333-3333-4333-8333-333333333333", child_id: "yp-1",
        key_worker_id: "st-1", session_type: "care_plan_review", status: "completed",
        planned_date: "2026-09-01", completed_date: "2026-09-02", duration_minutes: 45,
        location: "quiet room", topics_covered: ["school", "contact"],
        child_voice: "I want more time with my brother", child_mood: 4, child_engagement: 5,
        outcomes: [], actions: ["arrange sibling call"], next_session_topics: ["follow up on call"],
        safeguarding_concerns: null, positive_observations: ["opened up quickly"],
        attachments_count: 0, signed_off_by: null,
        created_at: "2026-09-02T10:00:00Z", updated_at: "2026-09-02T10:00:00Z",
      },
      {
        id: "kw-2", home_id: "33333333-3333-4333-8333-333333333333", child_id: "yp-1",
        key_worker_id: "st-1", session_type: "one_to_one", status: "planned",
        planned_date: "2026-09-09", completed_date: null, duration_minutes: null,
        location: null, topics_covered: [], child_voice: null, child_mood: null,
        child_engagement: null, outcomes: [], actions: [], next_session_topics: [],
        safeguarding_concerns: null, positive_observations: [], attachments_count: 0,
        signed_off_by: null, created_at: "2026-09-05T10:00:00Z", updated_at: "2026-09-05T10:00:00Z",
      },
    ],
  });
});

import { dal } from "@/lib/db";

describe("dal.keyWorkingSessions (live leg — the consolidation projection)", () => {
  it("projects capture rows into the intelligence shape honestly", async () => {
    const sessions = await dal.keyWorkingSessions.findAll();
    expect(sessions).toHaveLength(2);
    const done = sessions.find((s) => s.id === "kw-1")!;
    expect(done.type).toBe("review");             // care_plan_review → review
    expect(done.date).toBe("2026-09-02");         // completed over planned
    expect(done.staff_id).toBe("st-1");
    expect(done.topics).toEqual(["school", "contact"]);
    expect(done.child_voice).toContain("brother");
    expect(done.mood_before).toBe(4);
    expect(done.mood_after).toBe(4);              // one recording: no fabricated delta
    expect(done.actions_agreed).toEqual(["arrange sibling call"]);
    expect(done.confidential).toBeNull();         // nothing recorded → not credited

    const planned = sessions.find((s) => s.id === "kw-2")!;
    expect(planned.mood_before).toBeNull();       // unrecorded mood stays null
    expect(planned.date).toBe("2026-09-09");      // falls back to planned_date
    expect(planned.follow_up).toBeNull();
  });
});
