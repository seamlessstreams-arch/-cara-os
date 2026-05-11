// ══════════════════════════════════════════════════════════════════════════════
// ARIA Committed Record Amendments — engine tests (Milestone 13)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import {
  proposeSuggestedRecord,
  commitSuggestedRecord,
} from "@/lib/aria/aria-suggested-records";
import {
  amendCommittedRecord,
  loadCommittedVersionHistory,
} from "@/lib/aria/aria-committed-amendments";

const HOME_ID = "home_amend_test";

function clearAll() {
  // Mark any pending suggestions for this home as superseded so they fall
  // out of pending lookups.
  const pending = db.ariaSuggestedRecords
    .findAll(HOME_ID)
    .filter((r) => r.status === "pending");
  for (const r of pending) db.ariaSuggestedRecords.patch(r.id, { status: "superseded" });
  // Drop committed records for this home from the underlying array.
  const committed = db.ariaCommittedRecords.findAll(HOME_ID);
  const all = db.ariaCommittedRecords.findAll();
  for (const c of committed) {
    const idx = all.indexOf(c);
    if (idx >= 0) all.splice(idx, 1);
  }
}

function commitOne(recordType: "behaviour_note" | "reflection") {
  const sug = proposeSuggestedRecord({
    homeId: HOME_ID,
    childId: "yp_alex",
    recordType,
    suggestedTitle: "Original title",
    suggestedBody: "Original body content.",
    generatedBy: "u_aria",
  });
  const result = commitSuggestedRecord(sug.id, "u_manager", null);
  if (!result) throw new Error("commit failed");
  return result.committed;
}

describe("aria-committed-amendments engine", () => {
  beforeEach(() => clearAll());

  it("first commit has version 1, is current and has no previous_version_id", () => {
    const c = commitOne("reflection");
    expect(c.version).toBe(1);
    expect(c.is_current_version).toBe(true);
    expect(c.previous_version_id).toBeNull();
    expect(c.amended_at).toBeNull();
  });

  it("amend creates v2, preserves v1 and chains correctly", () => {
    const c = commitOne("reflection");
    const result = amendCommittedRecord({
      recordId: c.id,
      newBody: "Corrected wording after manager review.",
      amendmentReason: "Typo and clarity correction",
      actorId: "u_manager",
    });
    if ("code" in result) throw new Error("expected success");
    expect(result.previous.is_current_version).toBe(false);
    expect(result.current.version).toBe(2);
    expect(result.current.previous_version_id).toBe(c.id);
    expect(result.current.is_current_version).toBe(true);
    expect(result.current.amended_by).toBe("u_manager");
    expect(result.current.amendment_reason).toBe("Typo and clarity correction");
    expect(result.diff.body_changed).toBe(true);
    expect(result.diff.title_changed).toBe(false);
  });

  it("safeguarding-sensitive amendments are flagged for manager review", () => {
    const c = commitOne("behaviour_note");
    const result = amendCommittedRecord({
      recordId: c.id,
      newBody: "Updated narrative",
      amendmentReason: "Additional context from key worker",
      actorId: "u_manager",
    });
    if ("code" in result) throw new Error("expected success");
    expect(result.current.amendment_requires_manager_review).toBe(true);
  });

  it("non-sensitive amendments do NOT require manager review", () => {
    const c = commitOne("reflection");
    const result = amendCommittedRecord({
      recordId: c.id,
      newBody: "Updated reflection",
      amendmentReason: "Tone tweak",
      actorId: "u_manager",
    });
    if ("code" in result) throw new Error("expected success");
    expect(result.current.amendment_requires_manager_review).toBe(false);
  });

  it("refuses amendment without reason", () => {
    const c = commitOne("reflection");
    const result = amendCommittedRecord({
      recordId: c.id,
      newBody: "x",
      amendmentReason: "   ",
      actorId: "u_manager",
    });
    expect("code" in result && result.code).toBe("reason_required");
  });

  it("refuses amendment with no actual changes", () => {
    const c = commitOne("reflection");
    const result = amendCommittedRecord({
      recordId: c.id,
      amendmentReason: "Just for fun",
      actorId: "u_manager",
    });
    expect("code" in result && result.code).toBe("no_changes");
  });

  it("refuses amending a non-current version", () => {
    const c = commitOne("reflection");
    const r1 = amendCommittedRecord({
      recordId: c.id,
      newBody: "v2 body",
      amendmentReason: "first amendment",
      actorId: "u_manager",
    });
    if ("code" in r1) throw new Error("expected success");
    const r2 = amendCommittedRecord({
      recordId: c.id, // the now-superseded v1
      newBody: "should fail",
      amendmentReason: "trying to edit old version",
      actorId: "u_manager",
    });
    expect("code" in r2 && r2.code).toBe("not_current");
  });

  it("multi-step amendments chain correctly", () => {
    const c = commitOne("reflection");
    const r1 = amendCommittedRecord({
      recordId: c.id,
      newTitle: "Title v2",
      amendmentReason: "first",
      actorId: "u_manager",
    });
    if ("code" in r1) throw new Error("expected success");
    const r2 = amendCommittedRecord({
      recordId: r1.current.id,
      newBody: "Body v3",
      amendmentReason: "second",
      actorId: "u_manager",
    });
    if ("code" in r2) throw new Error("expected success");
    expect(r2.current.version).toBe(3);
    expect(r2.current.previous_version_id).toBe(r1.current.id);

    const history = loadCommittedVersionHistory(c.id);
    expect(history.map((h) => h.version)).toEqual([1, 2, 3]);
    expect(history[2].is_current_version).toBe(true);
    expect(history[0].is_current_version).toBe(false);
    expect(history[1].is_current_version).toBe(false);
  });

  it("parent suggestion's committed_record_id re-points to the new head", () => {
    const c = commitOne("reflection");
    const sug = db.ariaSuggestedRecords.findById(c.suggested_record_id);
    expect(sug?.committed_record_id).toBe(c.id);
    const r = amendCommittedRecord({
      recordId: c.id,
      newBody: "v2",
      amendmentReason: "tighten wording",
      actorId: "u_manager",
    });
    if ("code" in r) throw new Error("expected success");
    const sug2 = db.ariaSuggestedRecords.findById(c.suggested_record_id);
    expect(sug2?.committed_record_id).toBe(r.current.id);
  });

  it("returns not_found for unknown record id", () => {
    const result = amendCommittedRecord({
      recordId: "acom_does_not_exist",
      newBody: "x",
      amendmentReason: "y",
      actorId: "u_manager",
    });
    expect("code" in result && result.code).toBe("not_found");
  });
});
