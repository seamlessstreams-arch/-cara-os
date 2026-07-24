import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { db } from "@/lib/db/store";

// Admit-a-child intake: one request creates the young person, files the
// referral through the smart-documents pipeline, seeds draft risk assessments
// from its extracted risks, and instantiates the admission workflow as tasks.
// All deterministic — no AI credits involved anywhere.

const REFERRAL = `
Referral for: Jordan Mensah
Date of Birth: 22/08/2011
Gender: Male
Local Authority: Nottinghamshire County Council
Referral Source: Local Authority placement
Date of Referral: 3 July 2026
Social Worker: Michael Osei

Presenting Needs:
- Emotional dysregulation following family breakdown
- Disrupted education, needs reintegration support

Risk Factors:
- History of going missing
- Vulnerable to child criminal exploitation
- Self-harm (historic)

Estimated Placement Date: 1 August 2026
`;

function req(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/v1/admissions/admit", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const BASE = {
  first_name: "Jordan",
  last_name: "Mensah",
  date_of_birth: "2011-08-22",
  placement_start: "2099-08-01", // future so task anchoring is exact
  local_authority: "Nottinghamshire County Council",
  legal_status: "Section 20 (voluntary accommodation)",
};

describe("POST /admissions/admit", () => {
  it("rejects an admission missing the required fields", async () => {
    const res = await POST(req({ first_name: "Jordan" }));
    expect(res.status).toBe(400);
  });

  it("manual admission (no referral): creates the child and the full task workflow", async () => {
    const res = await POST(req({ ...BASE, first_name: "Manual" }));
    expect(res.status).toBe(200);
    const { data } = await res.json();

    expect(data.young_person.id).toBeTruthy();
    expect(data.document).toBeNull();
    expect(data.risk_assessments).toHaveLength(0);

    // 7 auto-create steps from the New Placement Admission template
    expect(data.tasks_created).toHaveLength(7);
    const admissionDay = data.tasks_created.find((t: { title: string }) => t.title.startsWith("Admission Day"));
    expect(admissionDay.due_date).toBe("2099-08-01");
    expect(admissionDay.priority).toBe("urgent");

    // the tasks are real records, linked to the child
    const task = db.tasks.findById(data.tasks_created[0].id);
    expect(task?.linked_child_id).toBe(data.young_person.id);
  });

  it("referral admission: files the document, seeds draft RAs, links everything", async () => {
    const res = await POST(req({ ...BASE, referral_text: REFERRAL, referral_file_name: "jordan-referral.txt" }));
    expect(res.status).toBe(200);
    const { data } = await res.json();
    const childId = data.young_person.id;

    // the referral is filed through the smart pipeline, against the child
    expect(data.document).not.toBeNull();
    const smartDoc = db.uploadedDocuments.findById(data.document.id);
    expect(smartDoc?.linked_child_id).toBe(childId);
    expect(smartDoc?.ai_result).not.toBeNull();

    // its extracted risks became draft risk assessments on the child
    const domains = data.risk_assessments.map((r: { domain: string }) => r.domain).sort();
    expect(domains).toEqual(["absconding", "exploitation", "self_harm"]);
    const ras = db.riskAssessments.findByChild(childId);
    expect(ras).toHaveLength(3);
    for (const ra of ras) expect(ra.status).toBe("draft");
    const selfHarm = ras.find((r) => r.domain === "self_harm")!;
    expect(selfHarm.triggers).toEqual(["Self-harm (historic)"]);

    // the workflow tasks carry the document link
    const task = db.tasks.findById(data.tasks_created[0].id);
    expect(task?.linked_document_id).toBe(data.document.id);
  });

  it("is deterministic: the same referral yields the same domains and task plan", async () => {
    const [a, b] = [
      await (await POST(req({ ...BASE, first_name: "DetA", referral_text: REFERRAL }))).json(),
      await (await POST(req({ ...BASE, first_name: "DetB", referral_text: REFERRAL }))).json(),
    ];
    expect(a.data.risk_assessments.map((r: { domain: string }) => r.domain).sort())
      .toEqual(b.data.risk_assessments.map((r: { domain: string }) => r.domain).sort());
    expect(a.data.tasks_created.map((t: { title: string; due_date: string }) => t.due_date))
      .toEqual(b.data.tasks_created.map((t: { title: string; due_date: string }) => t.due_date));
  });
});
