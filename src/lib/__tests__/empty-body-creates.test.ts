import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST as postContactLog } from "@/app/api/v1/contact-logs/route";
import { POST as postCarePlan } from "@/app/api/v1/care-plans/route";
import { POST as postComplaint } from "@/app/api/v1/complaints/route";

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
