import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET as getChecks, PATCH as patchCheck } from "@/app/api/v1/recruitment/checks/route";
import { GET as getRefs, PATCH as patchRef } from "@/app/api/v1/recruitment/references/route";
import { db } from "@/lib/db/store";

// Demo mode resolves identity from x-user-id, defaulting to a manager who holds
// MANAGE_RECRUITMENT — so these requests need no auth headers.
function makePatch(path: string, body: unknown): NextRequest {
  return new NextRequest(
    new Request(`http://x${path}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}
function makeGet(path: string): NextRequest {
  return new NextRequest(new Request(`http://x${path}`));
}

/**
 * A field the API accepts, echoes and lists must survive the round trip.
 *
 * Both routes used to destructure these from the PATCH body, omit them from the
 * update, and then serialize a hard-coded `null` — so a manager's risk
 * mitigation, their notes, and a referee's safeguarding narrative were accepted
 * by the API and silently discarded. Nothing surfaced the loss: the response
 * looked well-formed, it just always said null.
 */
describe("recruitment PATCH round-trip", () => {
  it("persists risk_mitigation and notes on a candidate check", async () => {
    const check = db.candidateChecks.findAll()[0];
    expect(check, "seed must provide a candidate check").toBeTruthy();

    const res = await patchCheck(
      makePatch("/api/v1/recruitment/checks", {
        id: check.id,
        candidate_id: check.candidate_id,
        risk_mitigation: "Supervised shifts only until the DBS certificate arrives.",
        notes: "Chased the DBS office on 14 Aug; reference number quoted.",
      }),
    );
    expect(res.status).toBe(200);

    const patched = (await res.json()).data;
    expect(patched.risk_mitigation).toBe("Supervised shifts only until the DBS certificate arrives.");
    expect(patched.notes).toBe("Chased the DBS office on 14 Aug; reference number quoted.");

    // ...and it must still be there on a fresh read, not just echoed back.
    const listed = (await (await getChecks(makeGet("/api/v1/recruitment/checks"))).json()).data
      .find((c: { id: string }) => c.id === check.id);
    expect(listed.risk_mitigation).toBe("Supervised shifts only until the DBS certificate arrives.");
    expect(listed.notes).toBe("Chased the DBS office on 14 Aug; reference number quoted.");
  });

  it("leaves untouched fields alone rather than nulling them", async () => {
    const check = db.candidateChecks.findAll()[1];
    expect(check, "seed must provide a second candidate check").toBeTruthy();

    await patchCheck(makePatch("/api/v1/recruitment/checks", {
      id: check.id, candidate_id: check.candidate_id, notes: "First note.",
    }));
    // A second PATCH that does not mention notes must not erase it.
    const res = await patchCheck(makePatch("/api/v1/recruitment/checks", {
      id: check.id, candidate_id: check.candidate_id, risk_mitigation: "Mitigation added later.",
    }));

    const patched = (await res.json()).data;
    expect(patched.notes).toBe("First note.");
    expect(patched.risk_mitigation).toBe("Mitigation added later.");
  });

  it("persists safeguarding_detail on a candidate reference", async () => {
    const ref = db.candidateReferences.findAll()[0];
    expect(ref, "seed must provide a candidate reference").toBeTruthy();

    const detail = "Referee described a 2019 allegation, unsubstantiated after a LADO strategy meeting.";
    const res = await patchRef(
      makePatch("/api/v1/recruitment/references", {
        id: ref.id,
        candidate_id: ref.candidate_id,
        safeguarding_concerns: true,
        safeguarding_detail: detail,
      }),
    );
    expect(res.status).toBe(200);

    const patched = (await res.json()).data;
    expect(patched.safeguarding_concerns).toBe(true);
    expect(patched.safeguarding_detail).toBe(detail);

    const listed = (await (await getRefs(makeGet("/api/v1/recruitment/references"))).json()).data
      .find((r: { id: string }) => r.id === ref.id);
    expect(listed.safeguarding_detail).toBe(detail);
  });
});
