import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

// The add form makes a category mandatory ("Please select a category"), but the
// record had no such field and this route built its row column by column, so
// the choice was dropped on the floor. The same form sent `started_by` and six
// fields belonging to a different Intervention type, none of which were stored.

function postReq(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/v1/intelligence/interventions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID = {
  child_id: "yp_alex",
  home_id: "home_oak",
  title: "Evening wind-down routine",
  description: "A consistent hour before bed with no screens.",
  rationale: "Sleep has been broken since the placement move.",
  intended_outcome: "Alex settles before 10pm most nights.",
  started_at: "2026-08-01",
};

describe("POST /api/v1/intelligence/interventions", () => {
  it("keeps the category the form requires", async () => {
    const res = await POST(postReq({ ...VALID, category: "therapeutic" }));
    expect(res.status).toBe(201);
    const { data } = await res.json();
    expect(data.category).toBe("therapeutic");
  });

  it("records no category rather than inventing one when none is sent", async () => {
    const res = await POST(postReq(VALID));
    expect(res.status).toBe(201);
    const { data } = await res.json();
    expect(data.category).toBeNull();
  });
});
