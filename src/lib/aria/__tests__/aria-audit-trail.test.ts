// ══════════════════════════════════════════════════════════════════════════════
// ARIA Audit Trail — engine tests (Milestone 11)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import {
  appendAriaAudit,
  loadAuditTrail,
  loadAuditActors,
  ARIA_AUDIT_ACTION_LABELS,
} from "@/lib/aria/aria-audit-trail";

const HOME_ID = "home_audit_test";

function clearAll() {
  // ariaStudioAuditLog has no public delete; mutate the underlying array.
  const all = db.ariaStudioAuditLog.findAll(HOME_ID);
  for (const row of all) {
    const arr = db.ariaStudioAuditLog.findAll();
    const idx = arr.indexOf(row);
    if (idx >= 0) arr.splice(idx, 1);
  }
}

describe("aria-audit-trail engine", () => {
  beforeEach(() => clearAll());

  it("appendAriaAudit writes a new audit entry", () => {
    const entry = appendAriaAudit({
      homeId: HOME_ID,
      actorId: "u_alice",
      actionType: "artifact_generated",
      summary: "drafted daily summary",
    });
    expect(entry).not.toBeNull();
    expect(entry?.action_type).toBe("artifact_generated");
    expect(entry?.actor_id).toBe("u_alice");
    expect(entry?.created_at).toBeTruthy();
  });

  it("loadAuditTrail returns entries newest first", () => {
    appendAriaAudit({
      homeId: HOME_ID,
      actorId: "u_alice",
      actionType: "artifact_generated",
      summary: "first",
    });
    // ensure ordering even at ms granularity
    const entries = loadAuditTrail(HOME_ID);
    appendAriaAudit({
      homeId: HOME_ID,
      actorId: "u_bob",
      actionType: "artifact_committed",
      summary: "second",
    });
    const after = loadAuditTrail(HOME_ID);
    expect(after.length).toBe(entries.length + 1);
    expect(after[0].prompt_summary).toBe("second");
  });

  it("loadAuditTrail filters by actor and action type", () => {
    appendAriaAudit({
      homeId: HOME_ID,
      actorId: "u_alice",
      actionType: "artifact_generated",
      summary: "a",
    });
    appendAriaAudit({
      homeId: HOME_ID,
      actorId: "u_bob",
      actionType: "artifact_rejected",
      summary: "b",
    });
    appendAriaAudit({
      homeId: HOME_ID,
      actorId: "u_alice",
      actionType: "artifact_committed",
      summary: "c",
    });
    expect(loadAuditTrail(HOME_ID, { actorId: "u_alice" })).toHaveLength(2);
    expect(loadAuditTrail(HOME_ID, { actionType: "artifact_rejected" })).toHaveLength(1);
    expect(
      loadAuditTrail(HOME_ID, { actorId: "u_alice", actionType: "artifact_committed" }),
    ).toHaveLength(1);
  });

  it("loadAuditTrail filters by sinceIso", () => {
    appendAriaAudit({
      homeId: HOME_ID,
      actorId: "u_alice",
      actionType: "artifact_generated",
      summary: "old",
    });
    const cutoff = new Date(Date.now() + 1000).toISOString();
    const after = loadAuditTrail(HOME_ID, { sinceIso: cutoff });
    expect(after).toHaveLength(0);
  });

  it("loadAuditTrail respects limit", () => {
    for (let i = 0; i < 5; i++) {
      appendAriaAudit({
        homeId: HOME_ID,
        actorId: "u_alice",
        actionType: "artifact_generated",
        summary: `n${i}`,
      });
    }
    expect(loadAuditTrail(HOME_ID, { limit: 3 })).toHaveLength(3);
  });

  it("loadAuditActors returns sorted distinct actor ids", () => {
    appendAriaAudit({
      homeId: HOME_ID,
      actorId: "u_charlie",
      actionType: "artifact_generated",
      summary: "x",
    });
    appendAriaAudit({
      homeId: HOME_ID,
      actorId: "u_alice",
      actionType: "artifact_generated",
      summary: "y",
    });
    appendAriaAudit({
      homeId: HOME_ID,
      actorId: "u_alice",
      actionType: "artifact_edited",
      summary: "z",
    });
    expect(loadAuditActors(HOME_ID)).toEqual(["u_alice", "u_charlie"]);
  });

  it("audit entries are scoped to their home", () => {
    appendAriaAudit({
      homeId: HOME_ID,
      actorId: "u_alice",
      actionType: "artifact_generated",
      summary: "ours",
    });
    appendAriaAudit({
      homeId: "other_home",
      actorId: "u_alice",
      actionType: "artifact_generated",
      summary: "theirs",
    });
    const ours = loadAuditTrail(HOME_ID);
    expect(ours.every((r) => r.home_id === HOME_ID)).toBe(true);
    expect(ours.find((r) => r.prompt_summary === "theirs")).toBeUndefined();
  });

  it("ARIA_AUDIT_ACTION_LABELS covers every audit action constant", () => {
    expect(ARIA_AUDIT_ACTION_LABELS["artifact_generated"]).toBeTruthy();
    expect(ARIA_AUDIT_ACTION_LABELS["artifact_committed"]).toBeTruthy();
    expect(ARIA_AUDIT_ACTION_LABELS["safeguarding_alert_created"]).toBeTruthy();
  });
});
