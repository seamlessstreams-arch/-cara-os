import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST as postContactLog } from "@/app/api/v1/contact-logs/route";
import { POST as postCarePlan } from "@/app/api/v1/care-plans/route";
import { POST as postComplaint } from "@/app/api/v1/complaints/route";
import { POST as postForm } from "@/app/api/v1/forms/route";
import { POST as postSupervision } from "@/app/api/v1/supervision/route";

// Regression guard. All three of these answered an EMPTY body with 201 and a
// written record:
//
//   contact-logs  outcome "positive", safeguarding_concern false — a positive
//                 contact with no concerns, for contact that never happened
//   care-plans    child_id "", status "active" — an active plan for no child
//   complaints    a real reference (CMP-2026-NNN) and statutory acknowledgement
//                 and response due dates, on a complaint with an empty summary
//
// readJsonBody proved the body was valid JSON. Nothing proved it said anything.
// These records then feed counts, compliance denominators and Reg 44 packs, so
// the fabrication does not stay where it was written.

function emptyPost() {
  return new NextRequest("http://localhost/probe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
}

describe("write routes reject an empty body", () => {
  it.each([
    ["contact-logs", postContactLog, "child_id"],
    ["care-plans", postCarePlan, "child_id"],
    ["complaints", postComplaint, "summary"],
  ] as const)("%s returns 400 naming the missing field", async (_name, handler, field) => {
    const res = await handler(emptyPost());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.missing).toContain(field);
  });

  it("still accepts a create that supplies the identifying field", async () => {
    const res = await postCarePlan(
      new NextRequest("http://localhost/probe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ child_id: "yp_probe_child" }),
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.child_id).toBe("yp_probe_child");
  });

  it("treats whitespace as missing, not as a value", async () => {
    const res = await postComplaint(
      new NextRequest("http://localhost/probe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ summary: "   " }),
      }),
    );
    expect(res.status).toBe(400);
  });
});

// forms and supervision were held back from the first two batches because they
// have several UI callers and a required field the UI omits would break a
// working create. Reading those callers settled it: BOTH already enforce these
// fields client-side — quick-create-modal refuses to submit without a title,
// and the supervision dialog refuses without staff_id AND scheduled_date. The
// server simply was not enforcing what the UI already believed, so a malformed
// or replayed request walked straight past a check the user could see.
describe("forms and supervision match the rule their own UI enforces", () => {
  it("forms rejects a create with no title", async () => {
    const res = await postForm(emptyPost());
    expect(res.status).toBe(400);
    expect((await res.json()).missing).toContain("title");
  });

  it("supervision rejects a create with no staff member or date", async () => {
    const res = await postSupervision(emptyPost());
    expect(res.status).toBe(400);
    const missing = (await res.json()).missing;
    expect(missing).toContain("staff_id");
    expect(missing).toContain("scheduled_date");
  });

  it("supervision still rejects a staff member with no date", async () => {
    const res = await postSupervision(
      new NextRequest("http://localhost/probe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ staff_id: "staff_probe" }),
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).missing).toEqual(["scheduled_date"]);
  });

  it("accepts the payload the supervision dialog actually sends", async () => {
    const res = await postSupervision(
      new NextRequest("http://localhost/probe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          staff_id: "staff_probe",
          scheduled_date: "2026-08-18",
          type: "formal",
          status: "scheduled",
        }),
      }),
    );
    expect(res.status).toBe(201);
    expect((await res.json()).data.staff_id).toBe("staff_probe");
  });

  it("accepts the payload the form dialog actually sends", async () => {
    const res = await postForm(
      new NextRequest("http://localhost/probe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "Weekly key-work record", form_type: "keywork", status: "draft" }),
      }),
    );
    expect(res.status).toBe(201);
    expect((await res.json()).data.title).toBe("Weekly key-work record");
  });
});
