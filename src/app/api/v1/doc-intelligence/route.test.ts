import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { GET as DETAIL_GET } from "./[docId]/route";
import { POST as APPROVE_POST } from "./[docId]/approve/route";

// The smart-documents upload must run its analysis DETERMINISTICALLY — no AI,
// no credits: category inference, key dates, actions → suggested tasks, risk
// flags, then the review → approve flow. These pin that pipeline end-to-end.
// (It used to save with an empty ai_result and a "Cara auto-analysis is off"
// note, so the smart flow never ran at all.)

const FIRE_DOC_TEXT = `Fire Risk Assessment — Oak House
Completed 01/02/2026. Next review due 01/02/2027.

Findings and actions:
- Action 1: Replace the faulty emergency light on the first-floor landing. Responsible: John Smith. Due 01/03/2026.
- Action 2: Ensure weekly fire alarm tests are recorded in the fire log.
- Must arrange a fire drill for night staff.
`;

function postReq(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/v1/doc-intelligence", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}
function getReq(qs = "") {
  return new NextRequest(`http://localhost/api/v1/doc-intelligence${qs}`);
}
const ctx = (docId: string) => ({ params: Promise.resolve({ docId }) });

async function upload(name: string, text: string) {
  const res = await POST(postReq({ original_file_name: name, file_type: "application/pdf", extracted_text: text }));
  expect(res.status).toBe(200);
  return (await res.json()).data;
}

describe("POST /doc-intelligence — deterministic smart upload", () => {
  it("runs the full analysis on upload: category, dates, tasks, risk — no AI", async () => {
    const doc = await upload("Fire Risk Assessment Feb 2026.pdf", FIRE_DOC_TEXT);

    expect(doc.ai_result).not.toBeNull();
    expect(doc.ai_result.document_category).toBe("fire_risk_assessment");
    // the actions in the text become suggested tasks
    expect(doc.ai_result.suggested_tasks.length).toBeGreaterThan(0);
    // the review date is extracted
    expect(doc.ai_result.extracted_entities.dates.length).toBeGreaterThan(0);
    // something actionable ⇒ lands in review, not silently approved
    expect(doc.document_status).toBe("review");
    expect(doc.ai_summary).toBeTruthy();
  });

  it("is deterministic: uploading the same text twice yields the same analysis", async () => {
    const a = await upload("determinism-check.pdf", FIRE_DOC_TEXT);
    const b = await upload("determinism-check.pdf", FIRE_DOC_TEXT);
    expect(a.ai_result.document_category).toBe(b.ai_result.document_category);
    expect(a.ai_result.suggested_tasks.map((t: { title: string }) => t.title))
      .toEqual(b.ai_result.suggested_tasks.map((t: { title: string }) => t.title));
    expect(a.ai_result.ai_risk_level).toBe(b.ai_result.ai_risk_level);
  });

  it("uses the filename hint for child-record categories the compliance rules don't know", async () => {
    const doc = await upload("ZZ-risk-assessment-jordan.pdf", "General notes with no compliance cues.");
    expect(doc.ai_result.document_category).toBe("risk_assessment");
  });

  it("files a document with nothing actionable as approved rather than parking it in review", async () => {
    const doc = await upload("ZZ-plain-note.pdf", "A short note with nothing to act on.");
    expect(doc.ai_result.suggested_tasks).toHaveLength(0);
    expect(doc.document_status).toBe("approved");
  });
});

describe("GET /doc-intelligence — list carries the analysis", () => {
  it("round-trips an upload with its analysis and meta", async () => {
    const marker = `ZZ-roundtrip-${Math.random().toString(36).slice(2, 8)}.pdf`;
    await upload(marker, FIRE_DOC_TEXT);

    const res = await GET(getReq());
    const body = await res.json();
    const found = body.data.find((d: { original_file_name: string }) => d.original_file_name === marker);
    expect(found).toBeDefined();
    expect(found.ai_result.document_category).toBe("fire_risk_assessment");
    expect(found.document_status).toBe("review");

    expect(body.meta.total).toBe(body.data.length);
    for (const k of ["awaiting_review", "high_risk", "tasks_created", "injection_detected"]) {
      expect(typeof body.meta[k]).toBe("number");
    }
    // review docs are counted
    expect(body.meta.awaiting_review).toBeGreaterThan(0);
  });

  it("honours the status filter", async () => {
    const res = await GET(getReq("?status=review"));
    const { data } = await res.json();
    expect(data.every((d: { document_status: string }) => d.document_status === "review")).toBe(true);
  });
});

describe("review → approve flow", () => {
  it("detail returns the analysed document with its audit trail", async () => {
    const doc = await upload("ZZ-detail-fire-check.pdf", FIRE_DOC_TEXT);
    const res = await DETAIL_GET(getReq(), ctx(doc.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe(doc.id);
    expect(body.data.ai_result.suggested_tasks.length).toBeGreaterThan(0);
    const actions = body.audit_log.map((e: { action: string }) => e.action);
    expect(actions).toContain("document_uploaded");
    expect(actions).toContain("analysis_completed");
  });

  it("approving suggested tasks creates real tasks and marks the document actioned", async () => {
    const doc = await upload("ZZ-approve-fire-check.pdf", FIRE_DOC_TEXT);
    const taskIds = doc.ai_result.suggested_tasks.map((t: { id: string }) => t.id);
    expect(taskIds.length).toBeGreaterThan(0);

    const res = await APPROVE_POST(
      postReq({ action: "approve", approved_task_ids: taskIds }),
      ctx(doc.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tasks_created.length).toBe(taskIds.length);
    expect(body.data.document_status).toBe("actioned");
    expect(body.data.tasks_created.length).toBe(taskIds.length);
  });
});
