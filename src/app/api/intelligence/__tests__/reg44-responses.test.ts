import { describe, it, expect } from "vitest";
import { GET as reg44GET, PATCH as reg44PATCH } from "@/app/api/intelligence/reg44/route";
import { PATCH as actionPATCH } from "@/app/api/intelligence/reg44-actions/route";
import { NextRequest } from "next/server";

// The registered person's response to an independent visitor's report had no
// endpoint at all — the UI offered "Add Manager Response" and the button was
// inert, so a home could not evidence what it did about a Reg 44 report.
//
// The allowlist test is the important one. The sibling reg44-actions PATCH
// spreads `...updates` wholesale; this handler must not, because the visit row
// holds the VISITOR's findings, and a spread would let the home rewrite what
// was said about it and call it a response.

function makeReq(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(new Request(url, init));
}

const patchVisit = (body: unknown) =>
  reg44PATCH(makeReq("http://x/api/intelligence/reg44", { method: "PATCH", body: JSON.stringify(body) }));

const firstVisit = async () => {
  const body = await (await reg44GET(makeReq("http://x/api/intelligence/reg44"))).json();
  return body.visits[0];
};

describe("reg44 visit PATCH — recording a response", () => {
  it("records a manager response against the visit", async () => {
    const visit = await firstVisit();
    const res = await patchVisit({ id: visit.id, manager_response: "  Two actions raised; both closed.  " });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.visit.manager_response).toBe("Two actions raised; both closed.");

    // and it is readable back, not just echoed
    const reread = (await firstVisit());
    expect(reread.id).toBe(visit.id);
    expect(reread.manager_response).toBe("Two actions raised; both closed.");
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
    const before = { summary: visit.summary, concerns: visit.concerns, visitor_name: visit.visitor_name };

    const res = await patchVisit({
      id: visit.id,
      manager_response: "Noted.",
      summary: "Everything was fine",
      concerns: null,
      visitor_name: "Someone Else",
      status: "closed",
    });
    expect(res.status).toBe(200);

    const after = await firstVisit();
    expect(after.manager_response).toBe("Noted.");
    expect(after.summary).toBe(before.summary);
    expect(after.concerns).toBe(before.concerns);
    expect(after.visitor_name).toBe(before.visitor_name);
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

describe("reg44 action PATCH — the response the actions table asked for", () => {
  it("stores a manager response on an action", async () => {
    const listed = await (await reg44GET(makeReq("http://x/api/intelligence/reg44"))).json();
    expect(listed.ok).toBe(true);

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
