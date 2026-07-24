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
import { generateId, todayStr } from "@/lib/utils";
import {
  analyseDocumentText,
  classifyTableCategory,
  deriveUploadedDocument,
  fileTypeFromMime,
  statusForAnalysis,
} from "@/lib/compliance/uploaded-document-bridge";
import type { UploadedDocument } from "@/types/documents";

// Enough text for the date/action extraction to work with, while staying an
// excerpt rather than an unbounded blob in the documents table.
const TEXT_LIMIT = 20_000;

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

  const name = (b.original_file_name as string) || "Uploaded document";
  const ctx = (b.upload_context as string) || "";
  const text = ((b.extracted_text as string) || "").slice(0, TEXT_LIMIT);
  const actorId = (b.actor_id as string) || "staff_darren";
  const now = new Date().toISOString();
  const today = todayStr();

  const tableCategory = classifyTableCategory(name, ctx);

  // ── Deterministic analysis (no AI, no credits) ─────────────────────────────
  const aiResult = analyseDocumentText({ text, fileName: name, title: name, tableCategory, today });

  // ── Durable record: the documents table via the dual-mode dal ──────────────
  const doc = await dal.documents.create({
    title: name,
    category: tableCategory,
    description: text || null,
    file_name: name,
    file_size: (b.file_size as number) || 0,
    mime_type: (b.file_type as string) || "",
    file_url: "",
    version: 1,
    requires_read_sign: false,
    linked_child_id: (b.linked_child_id as string) ?? null,
    linked_staff_id: (b.linked_staff_id as string) ?? null,
    linked_incident_id: (b.linked_incident_id as string) ?? null,
    tags: ctx ? [ctx] : [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docId = (doc as any)?.id ?? generateId("doc");

  // ── Smart record: full UploadedDocument powering review → approve ──────────
  const uploaded: UploadedDocument = {
    id: docId,
    original_file_name: name,
    stored_file_path: "",
    file_type: fileTypeFromMime((b.file_type as string) || ""),
    file_size: (b.file_size as number) || 0,
    uploaded_by: actorId,
    uploaded_at: now,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    linked_home_id: ((doc as any)?.home_id as string) || "",
    linked_child_id: (b.linked_child_id as string) ?? null,
    linked_staff_id: (b.linked_staff_id as string) ?? null,
    linked_incident_id: (b.linked_incident_id as string) ?? null,
    linked_task_id: null,
    document_status: statusForAnalysis(aiResult),
    document_category: aiResult.document_category,
    classification_confidence: aiResult.confidence,
    ai_summary: aiResult.ai_summary,
    ai_risk_level: aiResult.ai_risk_level,
    review_required: aiResult.review_required,
    approved_by: null,
    approved_at: null,
    extracted_text: text,
    ai_result: aiResult,
    tasks_created: [],
    evidence_linked: false,
    chronology_created: false,
    upload_context: ctx || null,
    created_at: now,
    updated_at: now,
  };
  db.uploadedDocuments.create(uploaded);

  db.documentAuditLog.append({
    id: generateId("dal"),
    document_id: docId,
    action: "document_uploaded",
    actor_id: actorId,
    timestamp: now,
    details: `Uploaded "${name}" (${text.length} chars extracted)`,
    ai_confidence: null,
  });
  db.documentAuditLog.append({
    id: generateId("dal"),
    document_id: docId,
    action: "analysis_completed",
    actor_id: "cara_deterministic",
    timestamp: now,
    details: `Deterministic analysis: ${aiResult.document_category_label}, ${aiResult.suggested_tasks.length} suggested task(s), risk ${aiResult.ai_risk_level}`,
    ai_confidence: aiResult.confidence,
  });

  return NextResponse.json({ data: uploaded });
}
