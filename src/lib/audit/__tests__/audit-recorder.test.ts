import { describe, it, expect, beforeEach } from "vitest";
import {
  computeFieldChanges,
  recordEntityAudit,
  getRecordAuditTrail,
  __resetRecordAuditTrail,
  extractRequestAuditContext,
  auditFromRequest,
  toChangeHistory,
} from "../audit-recorder";

beforeEach(() => __resetRecordAuditTrail());

describe("computeFieldChanges", () => {
  it("captures changed, added and removed fields with old→new", () => {
    const changes = computeFieldChanges(
      { status: "open", severity: "low", note: "x" },
      { status: "closed", severity: "low", added: "y" },
    );
    expect(changes.status).toEqual({ old: "open", new: "closed" });
    expect(changes.added).toEqual({ old: null, new: "y" });
    expect(changes.note).toEqual({ old: "x", new: null });
    expect(changes.severity).toBeUndefined(); // unchanged
  });

  it("ignores bookkeeping fields (id / created_* / updated_*)", () => {
    const changes = computeFieldChanges(
      { id: "a", created_at: "t0", updated_at: "t0", updated_by: "u1", status: "open" },
      { id: "a", created_at: "t0", updated_at: "t1", updated_by: "u2", status: "open" },
    );
    expect(changes).toEqual({});
  });

  it("deep-compares nested values", () => {
    const same = computeFieldChanges({ tags: ["a", "b"] }, { tags: ["a", "b"] });
    expect(same).toEqual({});
    const diff = computeFieldChanges({ tags: ["a"] }, { tags: ["a", "b"] });
    expect(diff.tags).toEqual({ old: ["a"], new: ["a", "b"] });
  });

  it("treats null/undefined as no value", () => {
    expect(computeFieldChanges(null, null)).toEqual({});
    const c = computeFieldChanges({}, { x: "new" });
    expect(c.x).toEqual({ old: null, new: "new" });
  });
});

describe("recordEntityAudit", () => {
  it("captures a before→after entry in the in-memory trail (demo-safe, no Supabase)", async () => {
    const entry = await recordEntityAudit({
      entityType: "incident",
      entityId: "inc_1",
      homeId: "home_1",
      action: "update",
      before: { status: "open", severity: "low" },
      after: { status: "closed", severity: "high" },
      performedBy: "user_1",
    });
    expect(entry.changeCount).toBe(2);
    expect(entry.changes.status).toEqual({ old: "open", new: "closed" });
    expect(entry.durable).toBe(false); // no Supabase in the test env
    const trail = getRecordAuditTrail({ entityType: "incident", entityId: "inc_1" });
    expect(trail).toHaveLength(1);
    expect(trail[0].performedBy).toBe("user_1");
  });

  it("populates the trail synchronously (fire-and-forget callers still record)", () => {
    void recordEntityAudit({
      entityType: "task",
      entityId: "task_1",
      action: "update",
      before: { title: "a" },
      after: { title: "b" },
    });
    // No await — the in-memory push happens before the first await inside.
    expect(getRecordAuditTrail({ entityType: "task" })).toHaveLength(1);
  });

  it("filters newest-first and respects the limit", async () => {
    await recordEntityAudit({ entityType: "incident", entityId: "a", action: "update", changes: { x: { old: 1, new: 2 } } });
    await recordEntityAudit({ entityType: "incident", entityId: "b", action: "update", changes: { x: { old: 1, new: 2 } } });
    const all = getRecordAuditTrail({ entityType: "incident" });
    expect(all[0].entityId).toBe("b"); // newest first
    expect(getRecordAuditTrail({ entityType: "incident", limit: 1 })).toHaveLength(1);
  });

  it("never throws even with missing home / performer", async () => {
    await expect(
      recordEntityAudit({ entityType: "x", entityId: "y", action: "create", after: { a: 1 } }),
    ).resolves.toBeDefined();
    const [entry] = getRecordAuditTrail({ entityType: "x" });
    expect(entry.homeId).toBeNull();
    expect(entry.performedBy).toBe("system");
  });
});

describe("extractRequestAuditContext", () => {
  it("reads the first x-forwarded-for IP, user-agent and session", () => {
    const headers = new Map([
      ["x-forwarded-for", "203.0.113.7, 10.0.0.1"],
      ["user-agent", "Mozilla/5.0"],
      ["x-session-id", "sess_42"],
    ]);
    const ctx = extractRequestAuditContext({ headers: { get: (n) => headers.get(n) ?? null } });
    expect(ctx).toEqual({ ip: "203.0.113.7", userAgent: "Mozilla/5.0", sessionId: "sess_42" });
  });

  it("returns nulls when headers are absent", () => {
    const ctx = extractRequestAuditContext({ headers: { get: () => null } });
    expect(ctx).toEqual({ ip: null, userAgent: null, sessionId: null });
  });
});

describe("auditFromRequest", () => {
  it("extracts request context and records the change (fire-and-forget)", () => {
    const headers = new Map([
      ["x-forwarded-for", "198.51.100.5"],
      ["user-agent", "TestAgent"],
    ]);
    auditFromRequest(
      { headers: { get: (n) => headers.get(n) ?? null } },
      {
        entityType: "supervision",
        entityId: "sup_1",
        homeId: "home_1",
        action: "update",
        before: { notes: "draft" },
        after: { notes: "final" },
        performedBy: "manager_1",
      },
    );
    const [entry] = getRecordAuditTrail({ entityType: "supervision" });
    expect(entry.ipAddress).toBe("198.51.100.5");
    expect(entry.userAgent).toBe("TestAgent");
    expect(entry.performedBy).toBe("manager_1");
    expect(entry.changes.notes).toEqual({ old: "draft", new: "final" });
  });
});

describe("toChangeHistory", () => {
  it("maps field changes to the CornerstoneEvent change shape", () => {
    const out = toChangeHistory({ status: { old: "open", new: "closed" } }, "user_1", "2026-06-25T00:00:00.000Z");
    expect(out).toEqual([
      { at: "2026-06-25T00:00:00.000Z", by: "user_1", field: "status", from: "open", to: "closed" },
    ]);
  });
});
