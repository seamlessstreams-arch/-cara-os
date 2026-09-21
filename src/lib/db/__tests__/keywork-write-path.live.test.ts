import { describe, it, expect, vi, beforeEach } from "vitest";

// The other half of the keywork consolidation: cs_key_work_sessions had every
// inspection-facing reader and no writer. dal.keyWorkingSessions.create/update
// wrote to the in-memory store, which on a live tenant is gated empty at module
// load and lost on the next cold start — so a recorded key-work session never
// reached the table the Reg 45 evidence pack, the handover generator, the
// regulatory pulse and Cara's today-briefing all read.
//
// These tests pin the durable write: the payload that leaves the dal, and the
// round trip back through the projection.
vi.mock("@/lib/supabase/server", async () => {
  const { makeFakeSupabaseModule } = await import("@/lib/test-utils/fake-supabase");
  return makeFakeSupabaseModule({
    cs_key_work_sessions: [
      {
        id: "kw-new", home_id: "33333333-3333-4333-8333-333333333333", child_id: "yp-1",
        key_worker_id: "st-1", session_type: "wellbeing_check", status: "completed",
        planned_date: "2026-09-10", completed_date: "2026-09-10", duration_minutes: 30,
        location: "kitchen", topics_covered: ["sleep", "college"],
        child_voice: "tired but ok", child_mood: 4, child_mood_before: 2,
        child_engagement: null, outcomes: [], actions: ["book GP"],
        next_session_topics: ["college enrolment"], safeguarding_concerns: null,
        positive_observations: [], worker_observations: "settled, made eye contact throughout",
        attachments_count: 0, signed_off_by: null,
        created_at: "2026-09-10T18:00:00Z", updated_at: "2026-09-10T18:00:00Z",
      },
    ],
  });
});

import { dal } from "@/lib/db";
import { recordedWrites, clearRecordedWrites } from "@/lib/test-utils/fake-supabase";

beforeEach(() => clearRecordedWrites());

const session = {
  child_id: "yp-1", staff_id: "st-1", date: "2026-09-10",
  type: "wellbeing_check" as const, duration: 30, location: "kitchen",
  topics: ["sleep", "college"], child_voice: "tired but ok",
  worker_observations: "settled, made eye contact throughout",
  actions_agreed: ["book GP"], mood_before: 2 as const, mood_after: 4 as const,
  follow_up: "college enrolment", follow_up_date: null, follow_up_completed: null,
  linked_goals: [], confidential: null, home_id: "", created_at: "",
};

const insertPayload = () =>
  recordedWrites.find((w) => w.op === "insert")!.payload as Record<string, unknown>;
const updatePayload = () =>
  recordedWrites.find((w) => w.op === "update")!.payload as Record<string, unknown>;

describe("dal.keyWorkingSessions.create (live leg — the durable write)", () => {
  it("writes to cs_key_work_sessions, not the store", async () => {
    await dal.keyWorkingSessions.create(session as never);
    expect(recordedWrites.find((w) => w.op === "insert")?.table).toBe("cs_key_work_sessions");
  });

  it("sends every field the /key-working form captures", async () => {
    await dal.keyWorkingSessions.create(session as never);
    const p = insertPayload();
    expect(p.child_id).toBe("yp-1");
    expect(p.key_worker_id).toBe("st-1");
    expect(p.duration_minutes).toBe(30);
    expect(p.location).toBe("kitchen");
    expect(p.topics_covered).toEqual(["sleep", "college"]);
    expect(p.child_voice).toBe("tired but ok");
    expect(p.actions).toEqual(["book GP"]);
    // The mood pair is why the migration adds a column: writing only child_mood
    // would drop the reading the recorder entered for the start of the session
    // and leave the page's improvement average unanswerable.
    expect(p.child_mood_before).toBe(2);
    expect(p.child_mood).toBe(4);
    // Distinct from positive_observations, which lists positives only.
    expect(p.worker_observations).toBe("settled, made eye contact throughout");
    expect(p.next_session_topics).toEqual(["college enrolment"]);
  });

  it("stamps home_id from the server, never from the payload", async () => {
    await dal.keyWorkingSessions.create({ ...session, home_id: "somebody-elses-home" } as never);
    expect(insertPayload().home_id).not.toBe("somebody-elses-home");
  });

  it("writes one date to both date columns so findAll's order key is never null", async () => {
    await dal.keyWorkingSessions.create(session as never);
    expect(insertPayload().completed_date).toBe("2026-09-10");
    expect(insertPayload().planned_date).toBe("2026-09-10");
  });

  it("stores the session type the recorder chose, for all eight", async () => {
    // wellbeing_check and goal_setting were absent from the old read map and
    // folded into one_to_one. Both directions now carry all eight.
    const pairs = [
      ["wellbeing_check", "wellbeing_check"], ["goal_setting", "goal_setting"],
      ["review", "care_plan_review"], ["life_skills", "life_skills"],
      ["therapeutic", "therapeutic"], ["group", "group"],
      ["informal", "informal"], ["one_to_one", "one_to_one"],
    ] as const;
    for (const [app, row] of pairs) {
      clearRecordedWrites();
      await dal.keyWorkingSessions.create({ ...session, type: app } as never);
      expect(insertPayload().session_type, `${app} must store as ${row}`).toBe(row);
    }
  });

  it("discards a mood outside the 1-5 scale rather than clamping it", async () => {
    await dal.keyWorkingSessions.create({ ...session, mood_before: 0, mood_after: 9 } as never);
    expect(insertPayload().child_mood_before).toBeNull();
    expect(insertPayload().child_mood).toBeNull();
  });

  it("returns the row projected back, so the caller sees what was stored", async () => {
    const saved = await dal.keyWorkingSessions.create(session as never);
    expect(saved).toMatchObject({
      id: "kw-new", child_id: "yp-1", staff_id: "st-1", type: "wellbeing_check",
      mood_before: 2, mood_after: 4,
      worker_observations: "settled, made eye contact throughout",
    });
  });
});

describe("dal.keyWorkingSessions.update (live leg)", () => {
  it("patches only the keys supplied, leaving other columns alone", async () => {
    await dal.keyWorkingSessions.update("kw-new", { location: "garden" } as never);
    const p = updatePayload();
    expect(p.location).toBe("garden");
    expect(p).not.toHaveProperty("child_voice");
    expect(p).not.toHaveProperty("child_mood");
    expect(p).not.toHaveProperty("topics_covered");
  });

  it("never patches home_id, so a session cannot be walked to another home", async () => {
    await dal.keyWorkingSessions.update("kw-new", { home_id: "somebody-elses-home" } as never);
    expect(updatePayload()).not.toHaveProperty("home_id");
  });
});
