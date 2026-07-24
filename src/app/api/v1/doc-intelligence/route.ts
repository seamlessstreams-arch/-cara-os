// ══════════════════════════════════════════════════════════════════════════════
// DOC INTELLIGENCE — SMART DOCUMENT UPLOAD (deterministic, no AI required)
//
// POST /api/v1/doc-intelligence — the smart-upload endpoint behind the
// SmartUploadButton and the Document Intelligence page.
//
// Uploads used to save without any analysis: the AI pass needs API credits the
// live tenant does not have, so every document arrived with an empty ai_result
// and a "Cara auto-analysis is off" apology — the smart-documents flow
// (suggested tasks, key dates, risk flags, review → approve) never ran.
//
// The analysis now runs DETERMINISTICALLY on every upload via
// extractComplianceDocument (the no-AI-key spine): category inference, key
// dates, review/expiry, actions → suggested tasks, risk flags — same input,
// same result, no credits. Two records are written:
//   • a durable Document in the documents table via the dual-mode dal (the
//     text travels with it, so the analysis can be re-derived anywhere), and
//   • the full UploadedDocument (with ai_result) in the in-memory store, which
//     powers the review/approve flow.
// GET lists the store's smart records, then fills in any durable documents the
// current lambda has no record of (live cold start) by re-deriving their
// analysis from the stored text — deterministic means persistence of the
// analysis itself is unnecessary.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";
import { db } from "@/lib/db/store";
import { readJsonBody } from "@/lib/http/read-json";
import { todayStr } from "@/lib/utils";
import { deriveUploadedDocument } from "@/lib/compliance/uploaded-document-bridge";
import { performSmartUpload } from "@/lib/compliance/smart-upload";
import type { UploadedDocument } from "@/types/documents";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const risk = url.searchParams.get("risk_level");
  const category = url.searchParams.get("category");
  const today = todayStr();

  // Smart records first — they carry live review/approval state.
  const smart = db.uploadedDocuments.findAll();
  const seen = new Set(smart.map((d) => d.id));

  // Durable documents this lambda has no smart record of (cold start): the
  // analysis is deterministic, so rebuild it from the stored text.
  let derived: UploadedDocument[] = [];
  try {
    const docs = (await dal.documents.findAll()) as unknown as Parameters<typeof deriveUploadedDocument>[0][];
    derived = (docs ?? []).filter((d) => d && !seen.has(d.id)).map((d) => deriveUploadedDocument(d, today));
  } catch {
    derived = [];
  }

  let all = [...smart, ...derived];
  if (status && status !== "all") all = all.filter((d) => d.document_status === status);
  if (risk && risk !== "all") all = all.filter((d) => d.ai_risk_level === risk);
  if (category && category !== "all") all = all.filter((d) => d.document_category === category);
  all.sort((a, b) => String(b.uploaded_at).localeCompare(String(a.uploaded_at)));

  const meta = {
    total: all.length,
    awaiting_review: all.filter((d) => d.document_status === "review" || d.document_status === "pending").length,
    high_risk: all.filter((d) => d.ai_risk_level === "high" || d.ai_risk_level === "critical").length,
    tasks_created: all.reduce((s, d) => s + (d.tasks_created?.length ?? 0), 0),
    injection_detected: all.filter((d) => d.ai_result?.prompt_injection_detected).length,
  };

  return NextResponse.json({ data: all, meta });
}

export async function POST(req: NextRequest) {
  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data as Record<string, unknown>;

  const uploaded = await performSmartUpload({
    fileName: (b.original_file_name as string) || "Uploaded document",
    text: (b.extracted_text as string) || "",
    fileType: (b.file_type as string) || "",
    fileSize: (b.file_size as number) || 0,
    fileDataUrl: (b.file_data_url as string) || null,
    uploadContext: (b.upload_context as string) || "",
    actorId: (b.actor_id as string) || undefined,
    linkedChildId: (b.linked_child_id as string) ?? null,
    linkedStaffId: (b.linked_staff_id as string) ?? null,
    linkedIncidentId: (b.linked_incident_id as string) ?? null,
  });

  return NextResponse.json({ data: uploaded });
}
