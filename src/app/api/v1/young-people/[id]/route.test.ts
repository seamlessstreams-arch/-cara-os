import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { PATCH, DELETE, GET } from "./route";
import { db } from "@/lib/db/store";
import { __resetRecordAuditTrail, getRecordAuditTrail } from "@/lib/audit/audit-recorder";
import type { YoungPerson } from "@/types";

// The PATCH/DELETE handlers audit every edit to a child's record via
// auditFromRequest → recordEntityAudit, which captures the in-memory before→after
// trail SYNCHRONOUSLY (before any await), so it's assertable straight after the
// awaited handler resolves.

const idCtx = (id: string) => ({ params: Promise.resolve({ id }) });

function makeChild(overrides: Partial<YoungPerson> = {}) {
  return db.youngPeople.create({
    first_name: "Audit", last_name: "Probe", preferred_name: "AP",
    date_of_birth: "2011-05-04", gender: "male",
    placement_start: "2026-01-01", local_authority: "Testshire",
    legal_status: "Section 20", status: "current",
    ...overrides,
  });
}

describe("young-people/:id — audited edits", () => {
  beforeEach(() => __resetRecordAuditTrail());

  it("PATCH records a field-level before→after audit entry", async () => {
    const child = makeChild();
    const res = await PATCH(
      new NextRequest(`http://localhost/api/v1/young-people/${child.id}`, {
        method: "PATCH",
        body: JSON.stringify({ preferred_name: "Ace", legal_status: "Section 31" }),
        headers: { "content-type": "application/json", "x-user-id": "staff_darren" },
      }),
      idCtx(child.id),
    );
    expect(res.status).toBe(200);

    const trail = getRecordAuditTrail({ entityType: "young_person", entityId: child.id });
    expect(trail).toHaveLength(1);
    const entry = trail[0];
    expect(entry.action).toBe("update");
    expect(entry.performedBy).toBe("staff_darren");
    expect(entry.changes.preferred_name).toEqual({ old: "AP", new: "Ace" });
    expect(entry.changes.legal_status).toEqual({ old: "Section 20", new: "Section 31" });
    // bookkeeping fields (updated_by/updated_at) are never counted as human changes
    expect(entry.changes.updated_by).toBeUndefined();
    expect(entry.changeCount).toBe(2);
  });

  it("DELETE (soft archive) records a delete entry showing status current→ended", async () => {
    const child = makeChild();
    const res = await DELETE(
      new NextRequest(`http://localhost/api/v1/young-people/${child.id}`, {
        method: "DELETE",
        headers: { "x-user-id": "staff_darren" },
      }),
      idCtx(child.id),
    );
    expect(res.status).toBe(200);

    const trail = getRecordAuditTrail({ entityType: "young_person", entityId: child.id });
    expect(trail).toHaveLength(1);
    expect(trail[0].action).toBe("delete");
    expect(trail[0].changes.status).toEqual({ old: "current", new: "ended" });
    expect(trail[0].metadata?.soft_archive).toBe(true);
  });

  it("surfaces the audit trail in the record GET response", async () => {
    const child = makeChild();
    await PATCH(
      new NextRequest(`http://localhost/api/v1/young-people/${child.id}`, {
        method: "PATCH",
        body: JSON.stringify({ preferred_name: "Trace" }),
        headers: { "content-type": "application/json", "x-user-id": "staff_darren" },
      }),
      idCtx(child.id),
    );
    const getRes = await GET(new NextRequest(`http://localhost/api/v1/young-people/${child.id}`), idCtx(child.id));
    const body = await getRes.json();
    expect(body.related.audit_trail.length).toBe(1);
    expect(body.related.audit_trail[0].changes.preferred_name.new).toBe("Trace");
  });

  it("no-op edits are rejected before any audit is written", async () => {
    const child = makeChild();
    const res = await PATCH(
      new NextRequest(`http://localhost/api/v1/young-people/${child.id}`, {
        method: "PATCH",
        // only immutable/derived fields → nothing editable remains → 400
        body: JSON.stringify({ id: "yp_hack", home_id: "home_evil", age: 42 }),
        headers: { "content-type": "application/json", "x-user-id": "staff_darren" },
      }),
      idCtx(child.id),
    );
    expect(res.status).toBe(400);
    expect(getRecordAuditTrail({ entityType: "young_person", entityId: child.id })).toHaveLength(0);
  });
});
