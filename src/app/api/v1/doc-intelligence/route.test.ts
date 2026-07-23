import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

// The Document Intelligence page lists documents through GET /doc-intelligence.
// It used to return a hardcoded { data: [] }, so an upload persisted but the
// page stayed empty — "document intelligence not working". These pin the GET to
// actually read the documents back, with the meta the page's tiles depend on.

function getReq(qs = "") {
  return new NextRequest(`http://localhost/api/v1/doc-intelligence${qs}`);
}

describe("GET /doc-intelligence", () => {
  it("returns the persisted documents (not a hardcoded empty list) with meta", async () => {
    const res = await GET(getReq());
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    // demo store is seeded with documents — the list must not be empty
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.meta).toBeDefined();
    expect(body.meta.total).toBe(body.data.length);
    // meta fields the page reads must all be present
    for (const k of ["awaiting_review", "high_risk", "tasks_created", "injection_detected"]) {
      expect(typeof body.meta[k]).toBe("number");
    }
  });

  it("maps each document onto the UploadedDocument shape the page renders", async () => {
    const res = await GET(getReq());
    const { data } = await res.json();
    const d = data[0];
    for (const k of [
      "id", "original_file_name", "document_status", "ai_risk_level",
      "ai_result", "tasks_created", "extracted_text", "uploaded_at",
    ]) {
      expect(d).toHaveProperty(k);
    }
    // Deterministic save: no fabricated AI verdicts.
    expect(d.ai_risk_level).toBeNull();
    expect(d.ai_result).toBeNull();
    expect(Array.isArray(d.tasks_created)).toBe(true);
  });

  it("round-trips an upload: POST then GET shows it", async () => {
    const marker = "ZZ-doc-intel-roundtrip-risk-assessment.pdf";
    const postRes = await POST(
      new NextRequest("http://localhost/api/v1/doc-intelligence", {
        method: "POST",
        body: JSON.stringify({ original_file_name: marker, file_type: "application/pdf", extracted_text: "x" }),
        headers: { "content-type": "application/json" },
      }),
    );
    expect(postRes.status).toBe(200);

    const listRes = await GET(getReq());
    const { data } = await listRes.json();
    const found = data.find((d: { original_file_name: string }) => d.original_file_name === marker);
    expect(found).toBeDefined();
    // filename classified deterministically, no AI
    expect(found.document_category).toBe("risk_assessment");
  });

  it("honours the status filter", async () => {
    const res = await GET(getReq("?status=review"));
    const { data } = await res.json();
    // everything saves as "approved", so a review filter yields none — and
    // crucially does not throw
    expect(data.every((d: { document_status: string }) => d.document_status === "review")).toBe(true);
  });
});
