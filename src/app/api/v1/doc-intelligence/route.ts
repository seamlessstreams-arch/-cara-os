// ══════════════════════════════════════════════════════════════════════════════
// DOC INTELLIGENCE — UPLOAD (deterministic, no AI required)
//
// POST /api/v1/doc-intelligence  — the "smart upload" endpoint behind the
// SmartUploadButton used across the app (documents, referrals, care records…).
//
// It USED to fall through to the catch-all dispatcher, which wrote to the
// in-memory `uploadedDocuments` collection — gated empty and never persisted on
// a live tenant, so every upload silently vanished. And the AI analysis it
// implied needs API credits the live tenant does not have.
//
// This route makes upload work DETERMINISTICALLY without any AI: it persists a
// real Document to the documents table via the dual-mode dal (so it shows in the
// Documents library on a live tenant and survives a cold start), classifying the
// category by keyword. Cara's auto-analysis (suggested tasks/dates) is an
// optional enhancement that simply doesn't run here — the response carries a
// note to that effect and an empty task list, which the upload modal already
// handles. No credits, no dependency, always saves.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";
import { readJsonBody } from "@/lib/http/read-json";

// Deterministic category from the file name + upload context (no AI).
function classify(name: string, ctx: string): string {
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

// Map a persisted Document (the table POST writes to) onto the UploadedDocument
// shape the Document Intelligence page renders. Uploads are saved
// deterministically with no AI pass, so the AI-derived fields are null/empty
// rather than fabricated.
function toUploadedDocument(d: Record<string, unknown>) {
  const tags = Array.isArray(d.tags) ? (d.tags as string[]) : [];
  const mime = (d.mime_type as string) || "";
  const fileType =
    /pdf/.test(mime) ? "pdf" :
    /word|docx/.test(mime) ? "docx" :
    /sheet|xlsx|excel/.test(mime) ? "xlsx" :
    /csv/.test(mime) ? "csv" :
    /png/.test(mime) ? "png" :
    /jpe?g/.test(mime) ? "jpg" :
    /plain|txt/.test(mime) ? "txt" : "other";
  return {
    id: d.id as string,
    original_file_name: (d.title as string) || (d.file_name as string) || "Document",
    stored_file_path: (d.file_url as string) || "",
    file_type: fileType,
    file_size: (d.file_size as number) ?? 0,
    uploaded_by: (d.created_by as string) || "",
    uploaded_at: (d.created_at as string) || new Date().toISOString(),
    linked_home_id: (d.home_id as string) || "",
    linked_child_id: (d.linked_child_id as string) ?? null,
    linked_staff_id: (d.linked_staff_id as string) ?? null,
    linked_incident_id: (d.linked_incident_id as string) ?? null,
    linked_task_id: null,
    // Saved without a review workflow — a clean, honest terminal state.
    document_status: "approved",
    document_category: (d.category as string) ?? null,
    classification_confidence: null,
    ai_summary: null,
    ai_risk_level: null,
    review_required: false,
    approved_by: null,
    approved_at: (d.created_at as string) || null,
    extracted_text: (d.description as string) || "",
    ai_result: null,
    tasks_created: [],
    evidence_linked: false,
    chronology_created: false,
    upload_context: tags[0] ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

export async function GET(req: NextRequest) {
  // The Document Intelligence page lists documents through this path
  // (useDocumentIntelligence). It used to return a hardcoded empty array, so
  // every upload persisted to the documents table but the page showed nothing.
  // Read them back through the dual-mode dal so uploads actually appear — on a
  // live tenant as much as in demo.
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const risk = url.searchParams.get("risk_level");
  const category = url.searchParams.get("category");

  let docs: Record<string, unknown>[] = [];
  try {
    docs = (await dal.documents.findAll()) as unknown as Record<string, unknown>[];
  } catch {
    docs = [];
  }

  let mapped = docs.map(toUploadedDocument);
  if (status && status !== "all") mapped = mapped.filter((d) => d.document_status === status);
  if (risk && risk !== "all") mapped = mapped.filter((d) => d.ai_risk_level === risk);
  if (category && category !== "all") mapped = mapped.filter((d) => d.document_category === category);

  // newest first
  mapped.sort((a, b) => String(b.uploaded_at).localeCompare(String(a.uploaded_at)));

  const meta = {
    total: mapped.length,
    awaiting_review: mapped.filter((d) => d.document_status === "review" || d.document_status === "pending").length,
    high_risk: mapped.filter((d) => d.ai_risk_level === "high" || d.ai_risk_level === "critical").length,
    tasks_created: mapped.reduce((s, d) => s + (d.tasks_created?.length ?? 0), 0),
    injection_detected: mapped.filter((d) => d.ai_result?.prompt_injection_detected).length,
  };

  return NextResponse.json({ data: mapped, meta });
}

export async function POST(req: NextRequest) {
  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data as Record<string, unknown>;

  const name = (b.original_file_name as string) || "Uploaded document";
  const ctx = (b.upload_context as string) || "";
  const text = (b.extracted_text as string) || "";

  const doc = await dal.documents.create({
    title: name,
    category: classify(name, ctx),
    description: text ? text.slice(0, 2000) : null,
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

  // Shape the response the upload modal expects: a record with id + an empty
  // Cara analysis, plus a note that auto-analysis was skipped (deterministic mode).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = doc as any;
  return NextResponse.json({
    data: {
      ...d,
      original_file_name: name,
      status: "saved",
      ai_result: { suggested_tasks: [], summary: "", key_dates: [] },
    },
    cara_error:
      "Cara auto-analysis is off, so no tasks were suggested — the document has been saved to the Documents library. Add any follow-up tasks manually.",
  });
}
