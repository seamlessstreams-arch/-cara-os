import { describe, it, expect } from "vitest";
import { rowTo1to1, oneToOneToRow, rating1to5, sessionFormat } from "../keywork-1to1-projection";
import type { Database } from "@/lib/supabase/types";
import type { KeyworkerSessionRecord } from "@/types/extended";

type Row = Database["public"]["Tables"]["cs_key_work_sessions"]["Row"];

// The 1:1 Sessions page and /key-working now read and write the same rows.
// These pin the second projection: what a 1:1 becomes as a row, what a row
// becomes as a 1:1, and — the point of the whole change — that a field nobody
// recorded comes back as an absence rather than a number.

const row = (over: Partial<Row> = {}): Row => ({
  id: "kw-1", home_id: "home-1", child_id: "yp-1", key_worker_id: "st-1",
  session_type: "one_to_one", therapeutic_framework: null, status: "completed",
  planned_date: "2026-09-10", completed_date: "2026-09-10", duration_minutes: 40,
  location: null, topics_covered: ["sleep"], child_voice: "said he is tired",
  child_mood: 4, child_mood_before: 2, child_engagement: null, outcomes: [],
  actions: ["book GP"], next_session_topics: [], safeguarding_concerns: null,
  positive_observations: [], worker_observations: null, attachments_count: 0,
  signed_off_by: null, session_format: "one_to_one_walk", child_chose_format: true,
  staff_agenda: "college enrolment", child_actions: ["call his sister"],
  child_satisfaction: 5, follow_up_date: "2026-09-17", flags_raised: ["sleep"],
  notes: "good session", created_at: "2026-09-10T18:00:00Z",
  updated_at: "2026-09-10T18:00:00Z",
  ...over,
} as Row);

describe("rowTo1to1 — a stored row as the 1:1 page sees it", () => {
  it("maps every field the page records", () => {
    expect(rowTo1to1(row())).toEqual<KeyworkerSessionRecord>({
      id: "kw-1", child_id: "yp-1", staff_id: "st-1", session_date: "2026-09-10",
      duration_minutes: 40, format: "one_to_one_walk", child_chose_format: true,
      themes_covered: ["sleep"], child_went_in_with: 2, child_walked_out_with: 4,
      what_child_brought_up: "said he is tired", what_staff_brought_up: "college enrolment",
      agreed_actions_staff: ["book GP"], agreed_actions_child: ["call his sister"],
      child_satisfaction: 5, follow_up_date: "2026-09-17", flags_raised: ["sleep"],
      notes: "good session", home_id: "home-1", created_at: "2026-09-10T18:00:00Z",
    });
  });

  it("reports an unasked satisfaction as null, never as a score", () => {
    // The create dialog used to send 4 on every save, and the page averaged it
    // into a tile presented as the child's own rating.
    expect(rowTo1to1(row({ child_satisfaction: null })).child_satisfaction).toBeNull();
  });

  it("reports a /key-working session as having no 1:1 format", () => {
    const s = rowTo1to1(row({ session_format: null, child_chose_format: null }));
    expect(s.format).toBeNull();
    expect(s.child_chose_format).toBeNull();
  });

  it("discards a format it does not recognise rather than bucketing it", () => {
    expect(rowTo1to1(row({ session_format: "one_to_one_spaceship" })).format).toBeNull();
  });

  it("falls back down the date columns, never to an empty string", () => {
    expect(rowTo1to1(row({ completed_date: null })).session_date).toBe("2026-09-10");
    expect(rowTo1to1(row({ completed_date: null, planned_date: null })).session_date)
      .toBe("2026-09-10");
  });
});

describe("oneToOneToRow — a 1:1 on its way to the table", () => {
  it("sends the mood pair to the columns #1139 added", () => {
    const r = oneToOneToRow({ child_went_in_with: 2, child_walked_out_with: 5 });
    expect(r.child_mood_before).toBe(2);
    expect(r.child_mood).toBe(5);
  });

  it("marks the row as a one-to-one alongside the finer format", () => {
    const r = oneToOneToRow({ format: "one_to_one_cafe" });
    expect(r.session_format).toBe("one_to_one_cafe");
    // So the other projection, which reads session_type, does not read these
    // rows as an unspecified default.
    expect(r.session_type).toBe("one_to_one");
  });

  it("writes one date to both date columns so the order key is never null", () => {
    const r = oneToOneToRow({ session_date: "2026-09-10" });
    expect(r.completed_date).toBe("2026-09-10");
    expect(r.planned_date).toBe("2026-09-10");
  });

  it("keeps the two action lists apart", () => {
    const r = oneToOneToRow({ agreed_actions_staff: ["a"], agreed_actions_child: ["b"] });
    expect(r.actions).toEqual(["a"]);
    expect(r.child_actions).toEqual(["b"]);
  });

  it("omits keys the caller did not supply, so a patch blanks nothing", () => {
    const r = oneToOneToRow({ notes: "just the notes" });
    expect(r).toEqual({ notes: "just the notes" });
  });

  it("never carries home_id, so a session cannot be walked to another home", () => {
    expect(oneToOneToRow({ home_id: "somebody-elses-home" })).not.toHaveProperty("home_id");
  });

  it("stores a null satisfaction as null rather than dropping to a number", () => {
    expect(oneToOneToRow({ child_satisfaction: null }).child_satisfaction).toBeNull();
  });
});

describe("rating1to5 / sessionFormat", () => {
  it("keeps 1 to 5 and discards anything else, without clamping", () => {
    expect([1, 3, 5].map(rating1to5)).toEqual([1, 3, 5]);
    // 0 and 9 are not evidence of a 1 or a 5.
    expect([0, 6, 9, -1, NaN, Infinity, null, undefined, "4"].map(rating1to5))
      .toEqual([null, null, null, null, null, null, null, null, null]);
  });

  it("accepts only the eight formats the page offers", () => {
    expect(sessionFormat("crisis_check_in")).toBe("crisis_check_in");
    expect(sessionFormat("care_plan_review")).toBeNull();
    expect(sessionFormat(null)).toBeNull();
  });
});
