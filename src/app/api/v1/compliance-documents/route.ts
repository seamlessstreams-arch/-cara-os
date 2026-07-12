// CARA — /api/v1/compliance-documents
//   GET  → list compliance documents Cara has read (newest first)
//   POST { text, fileName?, title?, category? } → READ a compliance document:
//          extract its category, key dates and embedded actions, and persist it
//          as an UploadedDocument with a full ai_result. Deterministic (no AI
//          key needed); the actions can then be tracked as tasks.
import { NextResponse } from "next/server";
import { getStore, db } from "@/lib/db/store";
import { generateId } from "@/lib/utils";
import { extractComplianceDocument } from "@/lib/compliance/document-extraction";
import { COMPLIANCE_CATEGORIES } from "@/lib/compliance/compliance-oversight-engine";
import { DOCUMENT_CATEGORY_LABELS, type DocumentIntelCategory, type DocumentIntelFileType, type UploadedDocument } from "@/types/documents";
import { readJsonBody } from "@/lib/http/read-json";

export const dynamic = "force-dynamic";

function fileTypeOf(name?: string): DocumentIntelFileType {
  const ext = (name ?? "").toLowerCase().split(".").pop();
  if (ext === "pdf" || ext === "docx" || ext === "xlsx" || ext === "csv" || ext === "png" || ext === "jpg" || ext === "txt") return ext;
  return "txt";
}

export function GET() {
  const store = getStore() as any;
  const docs = (store.uploadedDocuments ?? [])
    .filter((d: UploadedDocument) => d.document_category && COMPLIANCE_CATEGORIES.has(d.document_category))
    .sort((a: UploadedDocument, b: UploadedDocument) => (a.uploaded_at < b.uploaded_at ? 1 : -1))
    .map((d: UploadedDocument) => ({ ...d, category_label: d.document_category ? DOCUMENT_CATEGORY_LABELS[d.document_category] : "Document" }));
  return NextResponse.json({ data: { documents: docs } });
}

export async function POST(req: Request) {
  let body: any = {};
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  try { body = __parsed.data; } catch { body = {}; }

  const text = String(body.text ?? "").trim();
  if (text.length < 20) {
    return NextResponse.json({ error: "Paste the document text (at least a couple of lines) so Cara can read it." }, { status: 400 });
  }
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();
  const actor = req.headers.get("x-user-id") || req.headers.get("cs_user_id") || "system";

  const extraction = extractComplianceDocument({
    text,
    fileName: body.fileName ? String(body.fileName) : undefined,
    title: body.title ? String(body.title) : undefined,
    category: body.category && DOCUMENT_CATEGORY_LABELS[body.category as DocumentIntelCategory] ? (body.category as DocumentIntelCategory) : null,
    today,
  });

  const id = generateId("doc");
  const label = DOCUMENT_CATEGORY_LABELS[extraction.category];
  const doc: UploadedDocument = {
    id,
    original_file_name: body.fileName ? String(body.fileName) : `${String(body.title ?? label)}.txt`,
    stored_file_path: "",
    file_type: fileTypeOf(body.fileName),
    file_size: text.length,
    uploaded_by: actor,
    uploaded_at: now,
    linked_home_id: "home_oak",
    linked_child_id: null,
    linked_staff_id: null,
    linked_incident_id: null,
    linked_task_id: null,
    document_status: "review",
    document_category: extraction.category,
    classification_confidence: extraction.categoryConfidence,
    ai_summary: extraction.summary,
    ai_risk_level: extraction.riskLevel,
    review_required: extraction.reviewRequired,
    approved_by: null,
    approved_at: null,
    extracted_text: text,
    ai_result: extraction.aiResult,
    tasks_created: [],
    evidence_linked: false,
    chronology_created: false,
    upload_context: body.title ? String(body.title) : null,
    created_at: now,
    updated_at: now,
  };
  db.uploadedDocuments.create(doc);

  return NextResponse.json({ data: { ...doc, category_label: label } }, { status: 201 });
}
