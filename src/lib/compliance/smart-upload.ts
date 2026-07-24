// ══════════════════════════════════════════════════════════════════════════════
// CARA — smart document upload (server helper, deterministic)
//
// The one implementation of "file a document with its deterministic analysis",
// shared by POST /api/v1/doc-intelligence (the SmartUploadButton path) and the
// admission intake (filing the initial referral against the child). Writes the
// durable documents row via the dual-mode dal, the full UploadedDocument smart
// record in the store, and the audit trail. No AI anywhere.
// ══════════════════════════════════════════════════════════════════════════════

import { dal } from "@/lib/db/dal";
import { db } from "@/lib/db/store";
import { generateId, todayStr } from "@/lib/utils";
import {
  analyseDocumentText,
  classifyTableCategory,
  fileTypeFromMime,
  statusForAnalysis,
} from "@/lib/compliance/uploaded-document-bridge";
import type { UploadedDocument } from "@/types/documents";

// Enough text for the date/action extraction to work with, while staying an
// excerpt rather than an unbounded blob in the documents table.
export const SMART_UPLOAD_TEXT_LIMIT = 20_000;

// A base64 data URL over this length is refused (kept under the serverless
// request-body limit; ~8M chars ≈ a ~5.9MB file). Larger files need real object
// storage — a follow-up.
const MAX_DATA_URL_CHARS = 8_000_000;

export interface SmartUploadInput {
  fileName: string;
  text: string;
  fileType?: string;
  fileSize?: number;
  /** The file's bytes as a base64 data URL, so the actual file is stored. */
  fileDataUrl?: string | null;
  uploadContext?: string;
  actorId?: string;
  linkedChildId?: string | null;
  linkedStaffId?: string | null;
  linkedIncidentId?: string | null;
}

export async function performSmartUpload(input: SmartUploadInput): Promise<UploadedDocument> {
  const name = input.fileName || "Uploaded document";
  const ctx = input.uploadContext || "";
  const text = (input.text || "").slice(0, SMART_UPLOAD_TEXT_LIMIT);
  const actorId = input.actorId || "staff_darren";
  const now = new Date().toISOString();
  const today = todayStr();

  const tableCategory = classifyTableCategory(name, ctx);

  // The actual uploaded file, retained as a base64 data URL so it is genuinely
  // stored and downloadable (not just its extracted text). Guarded by size.
  const storedFileUrl =
    input.fileDataUrl && input.fileDataUrl.startsWith("data:") && input.fileDataUrl.length <= MAX_DATA_URL_CHARS
      ? input.fileDataUrl
      : "";

  // ── Deterministic analysis (no AI, no credits) ─────────────────────────────
  const aiResult = analyseDocumentText({ text, fileName: name, title: name, tableCategory, today });

  // ── Durable record: the documents table via the dual-mode dal ──────────────
  const doc = await dal.documents.create({
    title: name,
    category: tableCategory,
    description: text || null,
    file_name: name,
    file_size: input.fileSize || 0,
    mime_type: input.fileType || "",
    file_url: storedFileUrl,
    version: 1,
    requires_read_sign: false,
    linked_child_id: input.linkedChildId ?? null,
    linked_staff_id: input.linkedStaffId ?? null,
    linked_incident_id: input.linkedIncidentId ?? null,
    tags: ctx ? [ctx] : [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docId = (doc as any)?.id ?? generateId("doc");

  // ── Smart record: full UploadedDocument powering review → approve ──────────
  const uploaded: UploadedDocument = {
    id: docId,
    original_file_name: name,
    stored_file_path: storedFileUrl,
    file_type: fileTypeFromMime(input.fileType || ""),
    file_size: input.fileSize || 0,
    uploaded_by: actorId,
    uploaded_at: now,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    linked_home_id: ((doc as any)?.home_id as string) || "",
    linked_child_id: input.linkedChildId ?? null,
    linked_staff_id: input.linkedStaffId ?? null,
    linked_incident_id: input.linkedIncidentId ?? null,
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

  return uploaded;
}
