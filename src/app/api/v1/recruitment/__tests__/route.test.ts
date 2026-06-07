import { describe, it, expect } from "vitest";
import { GET, POST } from "@/app/api/v1/recruitment/route";
import { NextRequest } from "next/server";

function makeGet(): NextRequest {
  return new NextRequest(new Request("http://x/api/v1/recruitment"));
}
function makePost(body: unknown): NextRequest {
  return new NextRequest(
    new Request("http://x/api/v1/recruitment", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("recruitment overview route", () => {
  it("POST creates a candidate at the enquiry stage", async () => {
    const res = await POST(makePost({ first_name: "Test", last_name: "Candidate", email: "t@x.com", source: "indeed" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.first_name).toBe("Test");
    expect(body.data.stage).toBe("enquiry");
    expect(body.data.id).toBeTruthy();
    expect(Array.isArray(body.data.blocker_summary)).toBe(true);
  });

  it("POST requires first and last name", async () => {
    expect((await POST(makePost({ first_name: "", last_name: "X" }))).status).toBe(400);
  });

  it("GET returns the RecruitmentOverview shape (candidates/vacancies/alerts/stats)", async () => {
    const created = await (
      await POST(makePost({ first_name: "Findable", last_name: "Person", email: "f@x.com" }))
    ).json();

    const res = await GET(makeGet());
    expect(res.status).toBe(200);
    const body = await res.json();

    // The shape the page consumes — previously the catch-all returned a raw
    // conditionalOffers list, so these were all undefined → empty dashboard.
    expect(Array.isArray(body.data.candidates)).toBe(true);
    expect(Array.isArray(body.data.vacancies)).toBe(true);
    expect(Array.isArray(body.data.alerts)).toBe(true);
    expect(body.data.stats).toBeTypeOf("object");
    for (const k of ["total_active", "blocked", "exceptional_starts", "avg_days_to_appoint"]) {
      expect(typeof body.data.stats[k]).toBe("number");
    }

    const found = body.data.candidates.find((c: { id: string }) => c.id === created.data.id);
    expect(found).toBeTruthy();
    expect(typeof found.compliance_score).toBe("number");
    expect(found.stage).toBe("enquiry");
  });
});
