import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST as ADMIT } from "./route";
import { GET as SLUG_GET, POST as SLUG_POST } from "../../[...slug]/route";
import {
  GET as YP_GET,
  PATCH as YP_PATCH,
  DELETE as YP_DELETE,
} from "../../young-people/[id]/route";

// Mirrors, in-process, the exact endpoint sequence the browser smoke harness
// (scripts/smoke-admit-live.js) drives: admit → read the child, its risk
// assessments and the referral document back through the collection dispatcher
// → archive the test child via the RESTful update path. This proves the
// harness's wiring and assertions are correct (demo mode: the dispatcher uses
// the in-memory store; on live the same slugs resolve to Postgres /
// generic_records, and dal.youngPeople.update writes the real young_people row).

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
const idCtx = (id: string) => ({ params: Promise.resolve({ id }) });
const get = (path: string, segs: string[]) => SLUG_GET(new NextRequest(`http://localhost/api/v1/${path}`), slugCtx(segs));

async function admit(body: Record<string, unknown>) {
  const res = await ADMIT(new NextRequest("http://localhost/api/v1/admissions/admit", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  }));
  return { status: res.status, body: await res.json() };
}

describe("admit smoke sequence (harness parity)", () => {
  it("admits, reads everything back through the dispatcher, then archives via the update path", async () => {
    // 1. Admit
    const admitRes = await admit({
      first_name: "ZZ-Smoke", last_name: "Test-DELETE", date_of_birth: "2012-01-01",
      placement_start: "2099-08-01", local_authority: "SMOKE TEST",
      referral_text: REFERRAL, referral_file_name: "zz-smoke.txt",
    });
    expect(admitRes.status).toBe(200);
    const d = admitRes.body.data;
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

    // 4. Archive via DELETE /young-people/:id — a SOFT archive (status "ended"),
    //    the same call the live harness now uses to clean up after itself.
    const del = await YP_DELETE(
      new NextRequest(`http://localhost/api/v1/young-people/${childId}`, { method: "DELETE" }),
      idCtx(childId),
    );
    expect(del.status).toBe(200);
    const delBody = await del.json();
    expect(delBody.archived).toBe(true);
    expect(delBody.data.status).toBe("ended");
    expect(delBody.data.placement_end).toBeTruthy();

    // 5. The archive updated in place — no duplicate record, and the child now
    //    reads back as "ended" through the single-record GET.
    const after = await (await get("young-people", ["young-people"])).json();
    const copies = (after.data ?? []).filter((c: { id: string }) => c.id === childId);
    expect(copies.length).toBe(1);
    const single = await YP_GET(new NextRequest(`http://localhost/api/v1/young-people/${childId}`), idCtx(childId));
    expect((await single.json()).data.status).toBe("ended");
  });

  it("PATCH /young-people/:id edits in place and refuses immutable / derived fields", async () => {
    const admitRes = await admit({
      first_name: "ZZ-Patch", last_name: "Check", date_of_birth: "2012-01-01",
      placement_start: "2099-08-01", local_authority: "SMOKE TEST",
    });
    const childId: string = admitRes.body.data.young_person.id;
    const homeBefore: string = admitRes.body.data.young_person.home_id;

    const res = await YP_PATCH(
      new NextRequest(`http://localhost/api/v1/young-people/${childId}`, {
        method: "PATCH",
        // preferred_name is a real editable column; id/home_id are immutable;
        // age is a GET-computed field that must never be written back.
        body: JSON.stringify({ preferred_name: "Zee", id: "yp_hacked", home_id: "home_evil", age: 99 }),
        headers: { "content-type": "application/json" },
      }),
      idCtx(childId),
    );
    expect(res.status).toBe(200);
    const updated = (await res.json()).data;
    expect(updated.id).toBe(childId);          // id untouched
    expect(updated.home_id).toBe(homeBefore);  // tenancy untouched
    expect(updated.preferred_name).toBe("Zee");
    expect("age" in updated ? updated.age : undefined).not.toBe(99);
  });

  it("dispatcher upsert-when-id now UPDATES in place — no duplicate (the closed gap)", async () => {
    // Admit a throwaway child, then POST /young-people with its id. Because
    // dal.youngPeople.update now exists, the dispatcher's upsert-when-id updates
    // the existing row (200) instead of creating a second one (was 201).
    const admitRes = await admit({
      first_name: "ZZ-Dup", last_name: "Check", date_of_birth: "2012-01-01",
      placement_start: "2099-08-01", local_authority: "SMOKE TEST",
    });
    const childId: string = admitRes.body.data.young_person.id;

    const before = await (await get("young-people", ["young-people"])).json();
    const countBefore = (before.data ?? []).filter((c: { id: string }) => c.id === childId).length;
    expect(countBefore).toBe(1);

    const upsert = await SLUG_POST(
      new NextRequest("http://localhost/api/v1/young-people", {
        method: "POST",
        body: JSON.stringify({ id: childId, status: "ended" }),
        headers: { "content-type": "application/json" },
      }),
      slugCtx(["young-people"]),
    );
    // 200 = updated in place (was 201 = duplicate created before this path existed).
    expect(upsert.status).toBe(200);
    expect((await upsert.json()).data.status).toBe("ended");

    const after = await (await get("young-people", ["young-people"])).json();
    const countAfter = (after.data ?? []).filter((c: { id: string }) => c.id === childId).length;
    expect(countAfter).toBe(1); // still exactly one — no duplicate
  });
});
