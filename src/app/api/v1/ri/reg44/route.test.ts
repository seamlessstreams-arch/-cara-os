import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

// Bucket 3 of the seeded-actors track. A Reg 44 independent-visit report is a
// statutory record; its author must be the authenticated caller, never the
// "staff_darren" seed default. On a LIVE tenant an unresolved session is
// REJECTED (getRequestIdentity returns 401 and the route propagates it) rather
// than filed under a guessed author — that is getRequestIdentity's own domain.
// Here we prove the demo header path and that a body-supplied author cannot
// forge the attribution.

function postAs(user: string, body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/v1/ri/reg44", {
    method: "POST",
    headers: { "content-type": "application/json", "x-user-id": user },
    body: JSON.stringify(body),
  });
}

const COMPLETE = { visitor_name: "Independent Person" };

describe("POST /api/v1/ri/reg44", () => {
  it("stamps the authenticated caller as created_by, not the seed default", async () => {
    const res = await POST(postAs("staff_someone_else", COMPLETE));
    expect(res.status).toBe(201);
    const { data } = await res.json();
    expect(data.created_by).toBe("staff_someone_else");
    expect(data.created_by).not.toBe("staff_darren");
  });

  it("ignores a created_by supplied in the body — the caller decides", async () => {
    const res = await POST(postAs("staff_someone_else", { ...COMPLETE, created_by: "staff_impersonated" }));
    const { data } = await res.json();
    expect(data.created_by).toBe("staff_someone_else");
  });
});
