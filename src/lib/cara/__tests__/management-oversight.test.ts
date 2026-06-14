// ══════════════════════════════════════════════════════════════════════════════
// Cara Management Oversight Queue — engine tests (Milestone 14)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import {
  proposeSuggestedRecord,
  commitSuggestedRecord,
  rejectSuggestedRecord,
} from "@/lib/cara/cara-suggested-records";
import {
  amendCommittedRecord,
  acknowledgeAmendment,
} from "@/lib/cara/cara-committed-amendments";
import { loadOversightQueue } from "@/lib/cara/management-oversight";

const HOME_ID = "home_oversight_test";

function clearAll() {
  const pending = db.caraSuggestedRecords
    .findAll(HOME_ID)
    .filter((r) => r.status === "pending");
  for (const r of pending) db.caraSuggestedRecords.patch(r.id, { status: "superseded" });
  // Wipe rejected ones too so recently-returned doesn't persist across tests
  const rejected = db.caraSuggestedRecords
    .findAll(HOME_ID)
    .filter((r) => r.status === "rejected");
  for (const r of rejected) db.caraSuggestedRecords.patch(r.id, { status: "superseded" });
  const committed = db.caraCommittedRecords.findAll(HOME_ID);
  const all = db.caraCommittedRecords.findAll();
  for (const c of committed) {
    const idx = all.indexOf(c);
    if (idx >= 0) all.splice(idx, 1);
  }
}

describe("management oversight queue", () => {
  beforeEach(() => clearAll());

  it("returns an empty queue when nothing needs attention", () => {
    const q = loadOversightQueue(HOME_ID);
    expect(q.total).toBe(0);
    expect(q.high + q.medium + q.low).toBe(0);
    expect(q.items).toEqual([]);
  });

  it("includes pending suggestions and weights safeguarding-sensitive types as high", () => {
    proposeSuggestedRecord({
      homeId: HOME_ID,
      childId: "yp_alex",
      recordType: "incident_summary",
      suggestedTitle: "Bedroom incident",
      suggestedBody: "Body",
      generatedBy: "u_cara",
    });
    proposeSuggestedRecord({
      homeId: HOME_ID,
      childId: "yp_alex",
      recordType: "reflection",
      suggestedTitle: "Quiet day",
      suggestedBody: "Body",
      generatedBy: "u_cara",
    });

    const q = loadOversightQueue(HOME_ID);
    expect(q.total).toBe(2);
    expect(q.high).toBeGreaterThanOrEqual(1);

    const incident = q.items.find((i) => i.title === "Bedroom incident")!;
    expect(incident.kind).toBe("pending_suggestion");
    expect(incident.is_safeguarding_sensitive).toBe(true);
    expect(incident.severity).toBe("high");
  });

  it("includes amendments that require manager review and not yet acknowledged", () => {
    const sug = proposeSuggestedRecord({
      homeId: HOME_ID,
      childId: "yp_alex",
      recordType: "behaviour_note",
      suggestedTitle: "Original",
      suggestedBody: "Body v1",
      generatedBy: "u_cara",
    });
    const c = commitSuggestedRecord(sug.id, "u_manager", null)!;

    // Before amendment: only the pending was there (now committed). Queue should be empty.
    let q = loadOversightQueue(HOME_ID);
    expect(q.items.find((i) => i.kind === "amendment_review")).toBeUndefined();

    const r = amendCommittedRecord({
      recordId: c.committed.id,
      newBody: "Body v2",
      amendmentReason: "Add detail",
      actorId: "u_manager",
    });
    if ("code" in r) throw new Error("expected success");

    q = loadOversightQueue(HOME_ID);
    const amendment = q.items.find((i) => i.kind === "amendment_review");
    expect(amendment).toBeDefined();
    expect(amendment!.is_safeguarding_sensitive).toBe(true);
    expect(amendment!.severity).toBe("high");
    expect(amendment!.source_id).toBe(r.current.id);
  });

  it("removes acknowledged amendments from the queue", () => {
    const sug = proposeSuggestedRecord({
      homeId: HOME_ID,
      childId: "yp_alex",
      recordType: "risk_update",
      suggestedTitle: "Risk",
      suggestedBody: "v1",
      generatedBy: "u_cara",
    });
    const c = commitSuggestedRecord(sug.id, "u_manager", null)!;
    const r = amendCommittedRecord({
      recordId: c.committed.id,
      newBody: "v2",
      amendmentReason: "manager ask",
      actorId: "u_manager",
    });
    if ("code" in r) throw new Error("expected success");

    let q = loadOversightQueue(HOME_ID);
    expect(q.items.some((i) => i.kind === "amendment_review")).toBe(true);

    const ack = acknowledgeAmendment(r.current.id, "u_manager");
    expect("code" in ack).toBe(false);

    q = loadOversightQueue(HOME_ID);
    expect(q.items.some((i) => i.kind === "amendment_review")).toBe(false);
  });

  it("acknowledge refuses on records that don't require review", () => {
    const sug = proposeSuggestedRecord({
      homeId: HOME_ID,
      childId: "yp_alex",
      recordType: "reflection",
      suggestedTitle: "Reflection",
      suggestedBody: "v1",
      generatedBy: "u_cara",
    });
    const c = commitSuggestedRecord(sug.id, "u_manager", null)!;
    const ack = acknowledgeAmendment(c.committed.id, "u_manager");
    expect("code" in ack && ack.code).toBe("not_review_required");
  });

  it("includes recently rejected/returned suggestions", () => {
    const sug = proposeSuggestedRecord({
      homeId: HOME_ID,
      childId: "yp_alex",
      recordType: "reflection",
      suggestedTitle: "Returned reflection",
      suggestedBody: "v1",
      generatedBy: "u_cara",
    });
    rejectSuggestedRecord(sug.id, "u_manager", "Please rephrase");

    const q = loadOversightQueue(HOME_ID);
    const returned = q.items.find((i) => i.kind === "returned_record");
    expect(returned).toBeDefined();
    expect(returned!.summary).toContain("Please rephrase");
  });

  it("sorts items by severity (high first), then oldest within severity", () => {
    proposeSuggestedRecord({
      homeId: HOME_ID,
      childId: null,
      recordType: "reflection",
      suggestedTitle: "Low",
      suggestedBody: "x",
      generatedBy: "u_cara",
    });
    proposeSuggestedRecord({
      homeId: HOME_ID,
      childId: null,
      recordType: "incident_summary",
      suggestedTitle: "High",
      suggestedBody: "x",
      generatedBy: "u_cara",
    });
    const q = loadOversightQueue(HOME_ID);
    expect(q.items[0].severity).toBe("high");
  });
});
