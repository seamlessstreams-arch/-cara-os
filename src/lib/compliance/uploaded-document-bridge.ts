// ══════════════════════════════════════════════════════════════════════════════
// CARA — UploadedDocument bridge (deterministic, no AI)
//
// The Document Intelligence ("smart documents") pipeline stores its rich
// records in the in-memory `uploadedDocuments` collection — which a live
// serverless tenant loses on every cold start. Durability comes from the
// `documents` table via the dual-mode dal, but that table has no analysis
// columns.
//
// This bridge squares the two WITHOUT a schema change: the analysis is fully
// deterministic (extractComplianceDocument — the no-AI-key spine), so it never
// needs persisting. Store the text once; re-derive the same DocumentAiResult
// from it whenever a durable document has no in-memory smart record. Same
// input → same analysis, on any lambda, after any cold start.
// ══════════════════════════════════════════════════════════════════════════════

import type { Document } from "@/types";
import type {
  DocumentAiResult,
  DocumentIntelCategory,
  DocumentIntelFileType,
  DocumentIntelStatus,
  UploadedDocument,
} from "@/types/documents";
import { extractComplianceDocument } from "@/lib/compliance/document-extraction";

// Deterministic documents-TABLE category from file name + upload context.
// This vocabulary belongs to the documents table (the library), not to the
// intelligence pipeline — INTEL_HINT below translates where a value also
// exists in DocumentIntelCategory.
export function classifyTableCategory(name: string, ctx: string): string {
  const s = `${name} ${ctx}`.toLowerCase();
  if (/risk.?assess/.test(s)) return "risk_assessment";
  if (/care.?plan/.test(s)) return "care_plan";
  if (/placement|referral|admission/.test(s)) return "placement_plan";
  if (/missing/.test(s)) return "missing_protocol";
  if (/behaviou?r/.test(s)) return "behaviour_support";
  if (/health|medical|medication/.test(s)) return "health_plan";
  if (/education|\bpep\b|school/.test(s)) return "education_plan";
  if (/reg.?44/.test(s)) return "reg44_report";
  if (/reg.?45/.test(s)) return "reg45_report";
  if (/ofsted/.test(s)) return "ofsted_correspondence";
  if (/supervision/.test(s)) return "supervision_record";
  if (/training|certificate/.test(s)) return "training_certificate";
  if (/procedure/.test(s)) return "procedure";
  return "policy";
}

// Table category → intelligence category, where a direct counterpart exists.
// Used as a hint into the extraction engine, whose own rules are richer for
// compliance documents but blind to child-record types like care plans.
const INTEL_HINT: Record<string, DocumentIntelCategory> = {
  risk_assessment: "risk_assessment",
  care_plan: "care_plan",
  placement_plan: "placement_plan",
  behaviour_support: "behaviour_support_plan",
  reg44_report: "reg44_report",
  ofsted_correspondence: "ofsted_communication",
  training_certificate: "training_certificate",
};

export function intelCategoryHint(tableCategory: string): DocumentIntelCategory | null {
  return INTEL_HINT[tableCategory] ?? null;
}

// The extraction engine's own rules only cover compliance documents; its
// fallback (policy_document @ 0.3) also drags every uncategorised note into a
// "needs a review cycle" flag. Run the engine first and only step in when it
// fell back: prefer the filename hint (child-record categories it can't see),
// else file as "other" so a plain note isn't nagged about review dates.
const WEAK_CONFIDENCE = 0.3;

export function analyseDocumentText(args: {
  text: string;
  fileName: string;
  title: string;
  tableCategory: string;
  today: string;
}): DocumentAiResult {
  const base = { text: args.text, fileName: args.fileName, title: args.title, today: args.today };
  const first = extractComplianceDocument(base);
  if (first.categoryConfidence > WEAK_CONFIDENCE) return first.aiResult;

  const hint = intelCategoryHint(args.tableCategory);
  const fallback: DocumentIntelCategory = hint ?? "other";
  return extractComplianceDocument({ ...base, category: fallback }).aiResult;
}

export function fileTypeFromMime(mime: string): DocumentIntelFileType {
  return /pdf/.test(mime) ? "pdf"
    : /word|docx/.test(mime) ? "docx"
    : /sheet|xlsx|excel/.test(mime) ? "xlsx"
    : /csv/.test(mime) ? "csv"
    : /png/.test(mime) ? "png"
    : /jpe?g/.test(mime) ? "jpg"
    : /plain|txt/.test(mime) ? "txt"
    : "other";
}

// A document lands in "review" when the analysis produced something a human
// should act on; otherwise it is filed as approved. Never "analysing" — the
// deterministic pass is synchronous.
export function statusForAnalysis(ai: DocumentAiResult): DocumentIntelStatus {
  return ai.review_required || ai.suggested_tasks.length > 0 ? "review" : "approved";
}

/**
 * Rebuild the full smart-document record for a durable `documents` row by
 * re-running the deterministic analysis over its stored text. The id is
 * preserved so store and table always refer to the same document.
 */
export function deriveUploadedDocument(dalDoc: Document, today: string): UploadedDocument {
  const text = dalDoc.description ?? "";
  const tags = Array.isArray(dalDoc.tags) ? dalDoc.tags : [];
  const aiResult = analyseDocumentText({
    text,
    fileName: dalDoc.file_name || dalDoc.title,
    title: dalDoc.title,
    tableCategory: dalDoc.category as string,
    today,
  });

  return {
    id: dalDoc.id,
    original_file_name: dalDoc.title || dalDoc.file_name || "Document",
    stored_file_path: dalDoc.file_url || "",
    file_type: fileTypeFromMime(dalDoc.mime_type || ""),
    file_size: dalDoc.file_size ?? 0,
    uploaded_by: dalDoc.created_by || "",
    uploaded_at: dalDoc.created_at,
    linked_home_id: dalDoc.home_id || "",
    linked_child_id: dalDoc.linked_child_id ?? null,
    linked_staff_id: dalDoc.linked_staff_id ?? null,
    linked_incident_id: dalDoc.linked_incident_id ?? null,
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
    upload_context: tags[0] ?? null,
    created_at: dalDoc.created_at,
    updated_at: dalDoc.updated_at,
  };
}
