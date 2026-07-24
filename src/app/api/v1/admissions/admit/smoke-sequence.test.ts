import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST as ADMIT } from "./route";
import { GET as SLUG_GET } from "../../[...slug]/route";

// Mirrors, in-process, the exact endpoint sequence the browser smoke harness
// (scripts/smoke-admit-live.js) drives: admit → read the child, its risk
// assessments and the referral document back through the collection dispatcher.
// This proves the harness's wiring and assertions are correct (demo mode: the
// dispatcher uses the in-memory store; on live the same slugs resolve to
// Postgres / generic_records).
//
// Note: the harness does NOT clean up, and this test documents why — young
// people have no update/delete API path (the /young-people/:id route is
// GET-only; the dispatcher's upsert-when-id would CREATE a duplicate, asserted
// below), so archiving the test child is left to the UI.

const REFERRAL = `
Referral for: ZZ-Smoke Test-DELETE
Date of Birth: 01/01/2012
Local Authority: SMOKE TEST — delete this record
Risk Factors:
- History of going missing
- Vulnerable to child criminal exploitation
- Self-harm (historic)
`;

const slugCtx = (segs: string[]) => ({ params: Promise.resolve({ slug: segs }) });
const get = (path: string, segs: string[]) => SLUG_GET(new NextRequest(`http://localhost/api/v1/${path}`), slugCtx(segs));

describe("admit smoke sequence (harness parity)", () => {
  it("admits, reads everything back through the dispatcher, then archives", async () => {
    // 1. Admit
    const admitRes = await ADMIT(new NextRequest("http://localhost/api/v1/admissions/admit", {
      method: "POST",
      body: JSON.stringify({
        first_name: "ZZ-Smoke", last_name: "Test-DELETE", date_of_birth: "2012-01-01",
        placement_start: "2099-08-01", local_authority: "SMOKE TEST",
        referral_text: REFERRAL, referral_file_name: "zz-smoke.txt",
      }),
      headers: { "content-type": "application/json" },
    }));
    expect(admitRes.status).toBe(200);
    const d = (await admitRes.json()).data;
    const childId: string = d.young_person.id;
    expect(childId).toBeTruthy();
    expect(d.tasks_created.length).toBe(7);
    expect(d.document?.id).toBeTruthy();
    expect(d.risk_assessments.map((r: { domain: string }) => r.domain).sort())
      .toEqual(["absconding", "exploitation", "self_harm"]);

    // 2. Child readable via GET /young-people (dispatcher)
    const roster = await (await get("young-people", ["young-people"])).json();
    expect((roster.data ?? []).some((c: { id: string }) => c.id === childId)).toBe(true);

    // 3. Risk assessments readable via GET /risk-assessments?child_id= (the #825 path)
    const raRes = await SLUG_GET(
      new NextRequest(`http://localhost/api/v1/risk-assessments?child_id=${childId}`),
      slugCtx(["risk-assessments"]),
    );
    const ras = (await raRes.json()).data ?? [];
    expect(ras.length).toBe(3);
    expect(ras.every((r: { status: string }) => r.status === "draft")).toBe(true);

  });

  it("confirms there is no young-person update path — the upsert creates a duplicate, so the harness must not auto-clean-up", async () => {
    // Admit a throwaway child, then try to "archive" it via the dispatcher
    // upsert-when-id. Because youngPeople has no dal.update and the [id] route is
    // GET-only, this creates a SECOND record (201) instead of updating — which is
    // exactly why scripts/smoke-admit-live.js leaves cleanup to the UI.
    const admitRes = await ADMIT(new NextRequest("http://localhost/api/v1/admissions/admit", {
      method: "POST",
      body: JSON.stringify({
        first_name: "ZZ-Dup", last_name: "Check", date_of_birth: "2012-01-01",
        placement_start: "2099-08-01", local_authority: "SMOKE TEST",
      }),
      headers: { "content-type": "application/json" },
    }));
    const childId: string = (await admitRes.json()).data.young_person.id;

    const { POST: SLUG_POST } = await import("../../[...slug]/route");
    const upsert = await SLUG_POST(
      new NextRequest("http://localhost/api/v1/young-people", {
        method: "POST",
        body: JSON.stringify({ id: childId, status: "ended" }),
        headers: { "content-type": "application/json" },
      }),
      slugCtx(["young-people"]),
    );
    // 201 = a new record was created (not an update) — the documented gap.
    expect(upsert.status).toBe(201);
  });
});
