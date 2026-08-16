// ══════════════════════════════════════════════════════════════════════════════
// CARA — COMMUNICATION DRAFT STORE
//
// The store these functions write to did not exist. `cs_communication_drafts`
// had no migration, so on the live tenant every call errored, and without
// Supabase every call returned either `{ ok: false, error: "Supabase not
// configured" }` or, for the list, an empty array. The route dressed that up as
// `{ ok: true, persisted: false }` — a response a caller cannot tell from a
// save. /communications' six controls were disabled for exactly that reason.
//
// So what is being tested here is not "does the function run". It is: does a
// draft written to this store STILL EXIST on the next read, and does a status
// change hold. A letter to a social worker that has to be reviewed by someone
// else before it goes out is worthless if the review cannot find it.
//
// These run against the in-memory path (no Supabase env in tests), which is the
// same path the demo tenant takes — so the behaviour asserted here is the
// behaviour a demo actually gets.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import {
  listDrafts, getDraft, createDraft, updateDraft,
  submitDraftForReview, approveDraft, markSent,
  getCommunicationStats, _resetFallbackDrafts,
} from "../communication-intelligence";

const write = (over: Partial<Parameters<typeof createDraft>[0]> = {}) =>
  createDraft({
    homeId: "home_oak",
    type: "social_worker_update",
    title: "Update for Alex's social worker",
    content: "Alex settled well this week and attended school every day.",
    createdBy: "staff_darren",
    ...over,
  });

beforeEach(() => _resetFallbackDrafts());

describe("a draft survives being written", () => {
  it("is returned by the next list — the whole reason the table exists", async () => {
    const created = await write();
    expect(created.ok).toBe(true);

    const after = await listDrafts("home_oak");
    expect(after.data).toHaveLength(1);
    expect(after.data![0].title).toBe("Update for Alex's social worker");
    expect(after.data![0].content).toContain("attended school every day");
  });

  it("is retrievable by id, with the fields the caller supplied", async () => {
    const created = await write({ childId: "yp_alex", caraGenerated: true, caraPromptUsed: "handover" });
    const found = await getDraft(created.data!.id);

    expect(found.ok).toBe(true);
    expect(found.data!.child_id).toBe("yp_alex");
    expect(found.data!.cara_generated).toBe(true);
    expect(found.data!.cara_prompt_used).toBe("handover");
    expect(found.data!.created_by).toBe("staff_darren");
  });

  it("starts at draft — a new communication has not been reviewed by anyone", async () => {
    const created = await write();
    expect(created.data!.status).toBe("draft");
    expect(created.data!.approved_by).toBeNull();
    expect(created.data!.sent_at).toBeNull();
  });

  it("belongs to one home, and another home cannot read it", async () => {
    await write();
    await write({ homeId: "home_elm", title: "Elm House letter" });

    const oak = await listDrafts("home_oak");
    const elm = await listDrafts("home_elm");

    expect(oak.data!.map((d) => d.title)).toEqual(["Update for Alex's social worker"]);
    expect(elm.data!.map((d) => d.title)).toEqual(["Elm House letter"]);
  });
});

describe("the review journey holds at every step", () => {
  it("draft → review → approved → sent, and each step is still there afterwards", async () => {
    const id = (await write()).data!.id;

    await submitDraftForReview(id, "staff_darren");
    expect((await getDraft(id)).data!.status).toBe("review");

    await approveDraft(id, "staff_olivia");
    const approved = (await getDraft(id)).data!;
    expect(approved.status).toBe("approved");
    // Who approved it is the point of an approval — not that it happened.
    expect(approved.approved_by).toBe("staff_olivia");
    expect(approved.approved_at).toBeTruthy();

    await markSent(id);
    const sent = (await getDraft(id)).data!;
    expect(sent.status).toBe("sent");
    expect(sent.sent_at).toBeTruthy();
    // Sending must not erase who approved it.
    expect(sent.approved_by).toBe("staff_olivia");
  });

  it("records the editor when a draft is changed", async () => {
    const id = (await write()).data!.id;
    await updateDraft(id, { content: "Corrected: Alex missed Thursday.", editedBy: "staff_olivia" });

    const after = (await getDraft(id)).data!;
    expect(after.content).toBe("Corrected: Alex missed Thursday.");
    expect(after.edited_by).toBe("staff_olivia");
    expect(after.edited_at).toBeTruthy();
  });

  it("leaves the title alone when only the content is edited", async () => {
    const id = (await write()).data!.id;
    await updateDraft(id, { content: "New body.", editedBy: "staff_olivia" });

    expect((await getDraft(id)).data!.title).toBe("Update for Alex's social worker");
  });
});

describe("what it refuses to pretend", () => {
  // This is the bug the store replaces: every one of these used to answer
  // `{ ok: false, error: "Supabase not configured" }`, which the route turned
  // into a success. A caller has to be able to tell a save from a no-op.
  it("does not invent a draft that was never written", async () => {
    const found = await getDraft("cmd_nope");
    expect(found.ok).toBe(false);
    expect(found.data).toBeUndefined();
  });

  it("fails an edit to a draft that does not exist, rather than reporting success", async () => {
    const result = await updateDraft("cmd_nope", { content: "x", editedBy: "staff_darren" });
    expect(result.ok).toBe(false);
  });

  it("fails an approval of a draft that does not exist", async () => {
    expect((await approveDraft("cmd_nope", "staff_olivia")).ok).toBe(false);
    expect((await submitDraftForReview("cmd_nope", "staff_olivia")).ok).toBe(false);
    expect((await markSent("cmd_nope")).ok).toBe(false);
  });

  it("returns an empty list for a home with nothing written, not a seeded one", async () => {
    const result = await listDrafts("home_oak");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });
});

describe("listing", () => {
  it("filters by status, so the review queue holds only what is awaiting review", async () => {
    const a = (await write({ title: "A" })).data!.id;
    await write({ title: "B" });
    await submitDraftForReview(a, "staff_darren");

    const inReview = await listDrafts("home_oak", { status: "review" });
    expect(inReview.data!.map((d) => d.title)).toEqual(["A"]);
  });

  it("filters by type and by child", async () => {
    await write({ type: "handover_summary", title: "Handover" });
    await write({ childId: "yp_alex", title: "Alex letter" });

    expect((await listDrafts("home_oak", { type: "handover_summary" })).data!.map((d) => d.title))
      .toEqual(["Handover"]);
    expect((await listDrafts("home_oak", { childId: "yp_alex" })).data!.map((d) => d.title))
      .toEqual(["Alex letter"]);
  });

  it("honours the limit", async () => {
    await write({ title: "1" });
    await write({ title: "2" });
    await write({ title: "3" });

    expect((await listDrafts("home_oak", { limit: 2 })).data).toHaveLength(2);
  });
});

describe("stats count what is in the store", () => {
  it("counts nothing when nothing has been written", async () => {
    const stats = await getCommunicationStats("home_oak");
    expect(stats.ok).toBe(true);
    expect(stats.data!.total).toBe(0);
    expect(stats.data!.cara_generated).toBe(0);
    expect(stats.data!.by_status).toEqual({});
  });

  it("counts by status and by type, for this home only", async () => {
    const a = (await write()).data!.id;
    await write({ type: "handover_summary" });
    await write({ homeId: "home_elm" });
    await approveDraft(a, "staff_olivia");

    const stats = (await getCommunicationStats("home_oak")).data!;
    expect(stats.total).toBe(2);
    expect(stats.by_status).toEqual({ approved: 1, draft: 1 });
    expect(stats.by_type).toEqual({ social_worker_update: 1, handover_summary: 1 });
  });

  it("counts Cara-generated drafts separately from hand-written ones", async () => {
    await write({ caraGenerated: true });
    await write();

    expect((await getCommunicationStats("home_oak")).data!.cara_generated).toBe(1);
  });
});
