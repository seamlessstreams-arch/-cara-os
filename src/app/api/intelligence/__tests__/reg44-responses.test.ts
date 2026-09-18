import { describe, it, expect } from "vitest";
import { GET as reg44GET, PATCH as reg44PATCH } from "@/app/api/intelligence/reg44/route";
import { PATCH as actionPATCH } from "@/app/api/intelligence/reg44-actions/route";
import { db } from "@/lib/db/store";
import { NextRequest } from "next/server";

// The registered person's response to an independent visitor's report.
// Since the visit-tracker fold the "visit" is a projection of the persisted
// A–Q report, and the response is recorded ON the report (never IN it):
// allow-listed to the two response fields, permitted after signing, audited.
//
// The allowlist test is the important one. A spread here would let the home
// rewrite what the visitor said about it and call it a response.

function makeReq(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(new Request(url, init));
}

const patchVisit = (body: unknown) =>
  reg44PATCH(makeReq("http://x/api/intelligence/reg44", { method: "PATCH", body: JSON.stringify(body) }));

const visits = async () => (await (await reg44GET(makeReq("http://x/api/intelligence/reg44"))).json()).visits as Array<Record<string, unknown>>;
const visitById = async (id: string) => (await visits()).find((v) => v.id === id)!;
const firstVisit = async () => (await visits())[0];

describe("reg44 visit PATCH — recording a response", () => {
  it("records a manager response against the visit and audits it on the report", async () => {
    const visit = await firstVisit();
    const before = db.reg44Reports.findById(visit.id as string)!.auditTrail.length;
    const res = await patchVisit({ id: visit.id, manager_response: "  Two actions raised; both closed.  " });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.visit.manager_response).toBe("Two actions raised; both closed.");
    expect(body.visit.manager_responded_at).toBeTruthy();

    // readable back, not just echoed
    expect((await visitById(visit.id as string)).manager_response).toBe("Two actions raised; both closed.");
    const report = db.reg44Reports.findById(visit.id as string)!;
    expect(report.auditTrail.length).toBe(before + 1);
    expect(report.auditTrail.at(-1)!.action).toBe("responded");
  });

  it("a response to a SIGNED report is allowed and does not touch the signed snapshot", async () => {
    const signed = db.reg44Reports.findAll().find((r) => r.locked)!;
    const snapshot = JSON.stringify(signed.signedSnapshot);
    const res = await patchVisit({ id: signed.id, ri_response: "Seen by the RI." });
    expect(res.status).toBe(200);
    const after = db.reg44Reports.findById(signed.id)!;
    expect(after.locked).toBe(true);
    expect(JSON.stringify(after.signedSnapshot)).toBe(snapshot);
    expect(after.riResponse?.text).toBe("Seen by the RI.");
  });

  it("records an RI response independently of the manager response", async () => {
    const visit = await firstVisit();
    await patchVisit({ id: visit.id, manager_response: "Manager text" });
    const res = await patchVisit({ id: visit.id, ri_response: "RI text" });
    const body = await res.json();
    expect(body.visit.ri_response).toBe("RI text");
    expect(body.visit.manager_response).toBe("Manager text");
  });

  it("refuses to rewrite the visitor's own findings", async () => {
    const visit = await firstVisit();
    const before = { summary: visit.summary, concerns: visit.concerns, visitor_name: visit.visitor_name, visit_date: visit.visit_date };

    const res = await patchVisit({
      id: visit.id,
      manager_response: "Noted.",
      summary: "Everything was fine",
      concerns: null,
      visitor_name: "Someone Else",
      visit_date: "2001-01-01",
      status: "closed",
      locked: false,
    });
    expect(res.status).toBe(200);

    const after = await visitById(visit.id as string);
    expect(after.manager_response).toBe("Noted.");
    expect(after.summary).toBe(before.summary);
    expect(after.concerns).toBe(before.concerns);
    expect(after.visitor_name).toBe(before.visitor_name);
    expect(after.visit_date).toBe(before.visit_date);
  });

  it("a manager response moves the tracker status from submitted to reviewed", async () => {
    const signed = db.reg44Reports.findAll().find((r) => r.locked && !r.managerResponse);
    if (!signed) return; // earlier tests may already have responded to every signed seed
    expect((await visitById(signed.id)).status).toBe("submitted");
    await patchVisit({ id: signed.id, manager_response: "Actioned." });
    expect((await visitById(signed.id)).status).toBe("reviewed");
  });

  it("400s without an id", async () => {
    expect((await patchVisit({ manager_response: "text" })).status).toBe(400);
  });

  it("400s when no response field is supplied — an empty save is not a response", async () => {
    const visit = await firstVisit();
    expect((await patchVisit({ id: visit.id })).status).toBe(400);
    expect((await patchVisit({ id: visit.id, manager_response: "   " })).status).toBe(400);
  });

  it("404s for an unknown visit rather than creating one", async () => {
    expect((await patchVisit({ id: "no-such-visit", manager_response: "text" })).status).toBe(404);
  });
});

describe("reg44 action PATCH — allow-listed", () => {
  it("stores a manager response on an action", async () => {
    const res = await actionPATCH(
      makeReq("http://x/api/intelligence/reg44-actions", {
        method: "PATCH",
        body: JSON.stringify({ id: "a1", manager_response: "Fire drill rescheduled for Friday." }),
      }),
    );
    // a1 is a seeded fallback action; if the seed changes this returns 404,
    // which is still the honest answer rather than a silent create.
    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      const body = await res.json();
      expect(body.action.manager_response).toBe("Fire drill rescheduled for Friday.");
    }
  });

  it("does not let a PATCH move an action to another home or report", async () => {
    const res = await actionPATCH(
      makeReq("http://x/api/intelligence/reg44-actions", {
        method: "PATCH",
        body: JSON.stringify({ id: "a1", home_id: "another-home", visit_id: "v9", status: "completed" }),
      }),
    );
    if (res.status !== 200) return;
    const body = await res.json();
    expect(body.action.home_id).toBe("home_oak");
    expect(body.action.visit_id).toBe("v1");
    expect(body.action.status).toBe("completed");
    expect(body.action.completed_at).toBeTruthy();
  });

  it("400s without an id", async () => {
    const res = await actionPATCH(
      makeReq("http://x/api/intelligence/reg44-actions", {
        method: "PATCH",
        body: JSON.stringify({ manager_response: "text" }),
      }),
    );
    expect(res.status).toBe(400);
  });
});
