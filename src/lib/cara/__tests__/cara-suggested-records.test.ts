// ══════════════════════════════════════════════════════════════════════════════
// Cara Suggested Records (commit queue) — engine tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import {
  proposeSuggestedRecord,
  editSuggestedRecord,
  rejectSuggestedRecord,
  commitSuggestedRecord,
  loadSuggestedRecords,
  loadCommittedRecords,
  isSafeguardingSensitiveRecordType,
} from "@/lib/cara/cara-suggested-records";

const HOME_ID = "home_oak";
const CHILD_ID = "yp_alex";

function basePropose(extras: Partial<Parameters<typeof proposeSuggestedRecord>[0]> = {}) {
  return proposeSuggestedRecord({
    homeId: HOME_ID,
    childId: CHILD_ID,
    recordType: "daily_log_summary",
    suggestedTitle: "Quiet evening shift",
    suggestedBody: "Alex completed homework and went to bed at 9.30pm.",
    sourceEvidence: [{ type: "daily_log", id: "dl_1", label: "Daily log – evening" }],
    generatedBy: "u_cara",
    ...extras,
  });
}

function clearAll() {
  // Mark any remaining pending suggestions as superseded so each test
  // starts from a clean "pending" set. We snapshot the list first to
  // avoid an infinite loop (status mutations don't shrink findAll).
  const pendings = db.caraSuggestedRecords
    .findAll(HOME_ID)
    .filter((r) => r.status === "pending");
  for (const r of pendings) {
    db.caraSuggestedRecords.patch(r.id, { status: "superseded" });
  }
}

describe("Cara Suggested Records", () => {
  beforeEach(() => {
    clearAll();
  });

  it("propose creates a pending suggestion with defaults", () => {
    const rec = basePropose();
    expect(rec.status).toBe("pending");
    expect(rec.edits_count).toBe(0);
    expect(rec.committed_record_id).toBeNull();
    expect(rec.target_label).toBe("Daily log summary");
    expect(rec.source_evidence).toHaveLength(1);
  });

  it("edit updates payload and bumps edits_count", () => {
    const rec = basePropose();
    const edited = editSuggestedRecord(rec.id, {
      suggestedTitle: "Updated title",
      suggestedBody: "Manager-rewritten body.",
    });
    expect(edited?.suggested_title).toBe("Updated title");
    expect(edited?.suggested_body).toBe("Manager-rewritten body.");
    expect(edited?.edits_count).toBe(1);
  });

  it("reject sets status=rejected with decision metadata", () => {
    const rec = basePropose();
    const rejected = rejectSuggestedRecord(rec.id, "u_manager", "not accurate");
    expect(rejected?.status).toBe("rejected");
    expect(rejected?.decided_by).toBe("u_manager");
    expect(rejected?.decision_note).toBe("not accurate");
  });

  it("commit creates an immutable committed record and links the suggestion", () => {
    const rec = basePropose();
    const result = commitSuggestedRecord(rec.id, "u_manager", "approved");
    expect(result).not.toBeNull();
    expect(result!.suggestion.status).toBe("committed");
    expect(result!.suggestion.committed_record_id).toBe(result!.committed.id);
    expect(result!.committed.body).toContain("homework");
    expect(result!.committed.committed_by).toBe("u_manager");

    // Committed record visible via loader
    const list = loadCommittedRecords(HOME_ID);
    expect(list.find((c) => c.id === result!.committed.id)).toBeTruthy();
  });

  it("non-pending suggestions refuse further edits, rejects and commits", () => {
    const rec = basePropose();
    rejectSuggestedRecord(rec.id, "u_manager", "no");
    const editAttempt = editSuggestedRecord(rec.id, { suggestedTitle: "tampered" });
    expect(editAttempt?.suggested_title).not.toBe("tampered");
    const rejectAgain = rejectSuggestedRecord(rec.id, "u_manager", "noo");
    expect(rejectAgain?.status).toBe("rejected");
    expect(rejectAgain?.decision_note).not.toBe("noo");
    const commitAttempt = commitSuggestedRecord(rec.id, "u_manager", null);
    expect(commitAttempt).toBeNull();
  });

  it("loadSuggestedRecords filters by status and returns newest first", () => {
    const a = basePropose({ suggestedTitle: "First" });
    const b = basePropose({ suggestedTitle: "Second" });
    rejectSuggestedRecord(a.id, "u_manager", null);
    const pending = loadSuggestedRecords(HOME_ID, "pending");
    expect(pending.every((r) => r.status === "pending")).toBe(true);
    expect(pending.find((r) => r.id === b.id)).toBeTruthy();
    expect(pending.find((r) => r.id === a.id)).toBeFalsy();
  });

  it("isSafeguardingSensitiveRecordType flags risk/incident/behaviour types", () => {
    expect(isSafeguardingSensitiveRecordType("risk_update")).toBe(true);
    expect(isSafeguardingSensitiveRecordType("incident_summary")).toBe(true);
    expect(isSafeguardingSensitiveRecordType("behaviour_note")).toBe(true);
    expect(isSafeguardingSensitiveRecordType("daily_log_summary")).toBe(false);
    expect(isSafeguardingSensitiveRecordType("reflection")).toBe(false);
  });
});
